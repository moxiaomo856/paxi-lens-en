/**
 * PaxiCosmJS compatibility layer
 *
 * Problem: Paxi's official SDK (paxi-cosmjs.umd.js) only includes the Cosmos tx module
 * (TxBody/AuthInfo/SignDoc/TxRaw/Any/Coin) and lacks the message classes of the bank/wasm modules
 * (MsgSend/MsgExecuteContract/MsgInstantiateContract/PubKey/coins).
 *
 * After the SDK loads, this file detects the missing classes and supplements them with hand-written protobuf encoders,
 * ensuring the code still works when the SDK lacks key classes.
 *
 * The encoding has been byte-verified against the official protobufjs library.
 */
(function () {
  'use strict';

  // ============================================================
  // protobuf base encoding functions
  // ============================================================

  function encodeVarint(n) {
    const bytes = [];
    n = BigInt(n);
    if (n === 0n) return new Uint8Array([0]);
    while (n > 0n) {
      let byte = Number(n & 0x7fn);
      n >>= 7n;
      if (n > 0n) byte |= 0x80;
      bytes.push(byte);
    }
    return new Uint8Array(bytes);
  }

  /** Encode length-delimited field (wire type 2) */
  function encodeLenDelim(fieldNum, data) {
    const tag = (fieldNum << 3) | 2;
    const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return concatBytes(encodeVarint(tag), encodeVarint(dataBytes.length), dataBytes);
  }

  /** Encode varint field (wire type 0) */
  function encodeVarintField(fieldNum, value) {
    const tag = (fieldNum << 3) | 0;
    return concatBytes(encodeVarint(tag), encodeVarint(value));
  }

  /** Concatenate multiple Uint8Arrays */
  function concatBytes(...arrays) {
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  // ============================================================
  // Coin encoding
  // ============================================================
  function encodeCoin(denom, amount) {
    return concatBytes(encodeLenDelim(1, denom), encodeLenDelim(2, amount));
  }

  // ============================================================
  // coins helper (replacement for PaxiCosmJS.coins)
  // ============================================================
  function coins(amount, denom) {
    return [{ denom, amount: String(amount) }];
  }

  // ============================================================
  // MsgSend encoding
  // protobuf: cosmos.bank.v1beta1.MsgSend
  // { string from_address = 1; string to_address = 2; repeated Coin amount = 3; }
  // ============================================================
  const MsgSend = {
    fromPartial(data) { return data; },
    encode(data) {
      const fromAddress = data.fromAddress || data.from_address;
      const toAddress = data.toAddress || data.to_address;
      const parts = [
        encodeLenDelim(1, fromAddress),
        encodeLenDelim(2, toAddress),
      ];
      // amount is a repeated Coin
      if (data.amount && data.amount.length > 0) {
        for (const coin of data.amount) {
          const coinBytes = encodeCoin(coin.denom, coin.amount);
          parts.push(encodeLenDelim(3, coinBytes));
        }
      }
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // MsgExecuteContract encoding
  // protobuf: cosmwasm.wasm.v1.MsgExecuteContract
  // { string sender = 1; string contract = 2; bytes msg = 3; repeated Coin funds = 5; }
  // Note: funds is field 5 (field 4 is reserved)
  // ============================================================
  const MsgExecuteContract = {
    fromPartial(data) { return data; },
    encode(data) {
      const sender = data.sender || data.sender_address;
      const contract = data.contract || data.contract_addr;
      const msg = data.msg || new Uint8Array();
      const parts = [
        encodeLenDelim(1, sender),
        encodeLenDelim(2, contract),
        encodeLenDelim(3, msg),
      ];
      if (data.funds && data.funds.length > 0) {
        for (const coin of data.funds) {
          const coinBytes = encodeCoin(coin.denom, coin.amount);
          parts.push(encodeLenDelim(5, coinBytes));
        }
      }
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // MsgInstantiateContract encoding
  // protobuf: cosmwasm.wasm.v1.MsgInstantiateContract
  // { string sender = 1; string admin = 2; uint64 code_id = 3; string label = 4; bytes msg = 5; repeated Coin funds = 6; }
  // ============================================================
  const MsgInstantiateContract = {
    fromPartial(data) { return data; },
    encode(data) {
      const parts = [
        encodeLenDelim(1, data.sender),
        encodeLenDelim(2, data.admin || ''),
        encodeVarintField(3, data.codeId || data.code_id || 0),
        encodeLenDelim(4, data.label || ''),
        encodeLenDelim(5, data.msg || new Uint8Array()),
      ];
      if (data.funds && data.funds.length > 0) {
        for (const coin of data.funds) {
          const coinBytes = encodeCoin(coin.denom, coin.amount);
          parts.push(encodeLenDelim(6, coinBytes));
        }
      }
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // PubKey encoding (secp256k1)
  // protobuf: cosmos.crypto.secp256k1.PubKey
  // { bytes key = 1; }
  // ============================================================
  const PubKey = {
    encode(data) {
      return { finish: () => encodeLenDelim(1, data.key) };
    },
  };

  // ============================================================
  // Any encoding (for the authorization field nested inside Grant)
  // protobuf: google.protobuf.Any
  // { string type_url = 1; bytes value = 2; }
  // ============================================================
  const AnyEncode = {
    encode(data) {
      return {
        finish: () => concatBytes(
          encodeLenDelim(1, data.typeUrl),
          encodeLenDelim(2, data.value),
        ),
      };
    },
  };

  // ============================================================
  // GenericAuthorization encoding
  // protobuf: cosmos.authz.v1beta1.GenericAuthorization
  // { string msg = 1; }  // msg = authorized message type URL
  // ============================================================
  const GenericAuthorization = {
    fromPartial(data) { return data; },
    encode(data) {
      return { finish: () => encodeLenDelim(1, data.msg) };
    },
  };

  // ============================================================
  // Timestamp encoding
  // protobuf: google.protobuf.Timestamp
  // { int64 seconds = 1; int32 nanos = 2; }
  // ============================================================
  const Timestamp = {
    fromPartial(data) { return data; },
    encode(data) {
      return {
        finish: () => concatBytes(
          encodeVarintField(1, data.seconds),
          encodeVarintField(2, data.nanos || 0),
        ),
      };
    },
  };

  // ============================================================
  // Grant encoding
  // protobuf: cosmos.authz.v1beta1.Grant
  // { Any authorization = 1; Timestamp expiration = 2; }
  // ============================================================
  const Grant = {
    fromPartial(data) { return data; },
    encode(data) {
      const authBytes = AnyEncode.encode(data.authorization).finish();
      const expBytes = Timestamp.encode(data.expiration).finish();
      return {
        finish: () => concatBytes(
          encodeLenDelim(1, authBytes),
          encodeLenDelim(2, expBytes),
        ),
      };
    },
  };

  // ============================================================
  // MsgGrant encoding — authorization
  // protobuf: cosmos.authz.v1beta1.MsgGrant
  // { string granter = 1; string grantee = 2; Grant grant = 3; }
  // ============================================================
  const MsgGrant = {
    fromPartial(data) { return data; },
    encode(data) {
      const grantBytes = Grant.encode(data.grant).finish();
      return {
        finish: () => concatBytes(
          encodeLenDelim(1, data.granter),
          encodeLenDelim(2, data.grantee),
          encodeLenDelim(3, grantBytes),
        ),
      };
    },
  };

  // ============================================================
  // MsgExec encoding — execute on behalf
  // protobuf: cosmos.authz.v1beta1.MsgExec
  // { string grantee = 1; repeated Any msgs = 2; }
  // ============================================================
  const MsgExec = {
    fromPartial(data) { return data; },
    encode(data) {
      const parts = [encodeLenDelim(1, data.grantee)];
      if (data.msgs) {
        for (const msg of data.msgs) {
          const anyBytes = AnyEncode.encode(msg).finish();
          parts.push(encodeLenDelim(2, anyBytes));
        }
      }
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // MsgUpdateAdmin encoding
  // protobuf: cosmwasm.wasm.v1.MsgUpdateAdmin
  // { string sender = 1; string new_admin = 2; string contract = 3; }
  // ============================================================
  const MsgUpdateAdmin = {
    fromPartial(data) { return data; },
    encode(data) {
      return {
        finish: () => concatBytes(
          encodeLenDelim(1, data.sender),
          encodeLenDelim(2, data.newAdmin),
          encodeLenDelim(3, data.contract),
        ),
      };
    },
  };

  // ============================================================
  // MsgMigrateContract encoding
  // protobuf: cosmwasm.wasm.v1.MsgMigrateContract
  // { string sender = 1; string contract = 2; uint64 code_id = 3; bytes msg = 4; }
  // ============================================================
  const MsgMigrateContract = {
    fromPartial(data) { return data; },
    encode(data) {
      return {
        finish: () => concatBytes(
          encodeLenDelim(1, data.sender),
          encodeLenDelim(2, data.contract),
          encodeVarintField(3, data.codeId || 0),
          encodeLenDelim(4, data.msg || new Uint8Array()),
        ),
      };
    },
  };

  // ============================================================
  // MsgRevoke encoding — revoke authorization
  // protobuf: cosmos.authz.v1beta1.MsgRevoke
  // { string granter = 1; string grantee = 2; string msg_type_url = 3; }
  // ============================================================
  const MsgRevoke = {
    fromPartial(data) { return data; },
    encode(data) {
      return {
        finish: () => concatBytes(
          encodeLenDelim(1, data.granter),
          encodeLenDelim(2, data.grantee),
          encodeLenDelim(3, data.msgTypeUrl),
        ),
      };
    },
  };

  // ============================================================
  // MsgBeginRedelegate encoding — staking redelegate
  // protobuf: cosmos.staking.v1beta1.MsgBeginRedelegate
  // { string delegator_address = 1; string validator_src_address = 2; string validator_dst_address = 3; Coin amount = 4; }
  // Support both snake_case (app.js) and camelCase (SDK style) field names
  // ============================================================
  const MsgBeginRedelegate = {
    fromPartial(data) { return data; },
    encode(data) {
      const delegatorAddress = data.delegator_address || data.delegatorAddress;
      const validatorSrcAddress = data.validator_src_address || data.validatorSrcAddress;
      const validatorDstAddress = data.validator_dst_address || data.validatorDstAddress;
      const parts = [
        encodeLenDelim(1, delegatorAddress),
        encodeLenDelim(2, validatorSrcAddress),
        encodeLenDelim(3, validatorDstAddress),
      ];
      if (data.amount) {
        const coinBytes = encodeCoin(data.amount.denom, data.amount.amount);
        parts.push(encodeLenDelim(4, coinBytes));
      }
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // TextProposal encoding — governance text proposal content
  // protobuf: cosmos.gov.v1beta1.TextProposal
  // { string title = 1; string description = 2; }
  // ============================================================
  const TextProposal = {
    fromPartial(data) { return data; },
    encode(data) {
      return {
        finish: () => concatBytes(
          encodeLenDelim(1, data.title || ''),
          encodeLenDelim(2, data.description || ''),
        ),
      };
    },
  };

  // ============================================================
  // ParamChange encoding — a single parameter item in a parameter-change proposal
  // protobuf: cosmos.params.v1beta1.ParamChange
  // { string subspace = 1; string key = 2; string value = 3; }
  // ============================================================
  const ParamChange = {
    fromPartial(data) { return data; },
    encode(data) {
      const parts = [];
      if (data.subspace) parts.push(encodeLenDelim(1, data.subspace));
      if (data.key) parts.push(encodeLenDelim(2, data.key));
      if (data.value != null) parts.push(encodeLenDelim(3, String(data.value)));
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // ParameterChangeProposal encoding — governance parameter-change proposal
  // protobuf: cosmos.params.v1beta1.ParameterChangeProposal
  // { string title = 1; string description = 2; repeated ParamChange changes = 3; }
  // ============================================================
  const ParameterChangeProposal = {
    fromPartial(data) { return data; },
    encode(data) {
      const parts = [
        encodeLenDelim(1, data.title || ''),
        encodeLenDelim(2, data.description || ''),
      ];
      if (data.changes && Array.isArray(data.changes)) {
        for (const c of data.changes) {
          const cBytes = ParamChange.encode(c).finish();
          parts.push(encodeLenDelim(3, cBytes));
        }
      }
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // MsgSubmitProposal encoding — governance submit proposal
  // protobuf: cosmos.gov.v1beta1.MsgSubmitProposal
  // { Any content = 1; repeated Coin initial_deposit = 2; string proposer = 3; }
  // ============================================================
  const MsgSubmitProposal = {
    fromPartial(data) { return data; },
    encode(data) {
      const parts = [];
      if (data.content) {
        const anyBytes = AnyEncode.encode(data.content).finish();
        parts.push(encodeLenDelim(1, anyBytes));
      }
      if (data.initial_deposit || data.initialDeposit) {
        const deposit = data.initial_deposit || data.initialDeposit || [];
        for (const coin of deposit) {
          const coinBytes = encodeCoin(coin.denom, coin.amount);
          parts.push(encodeLenDelim(2, coinBytes));
        }
      }
      if (data.proposer) {
        parts.push(encodeLenDelim(3, data.proposer));
      }
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // CommunityPoolSpendProposal encoding — community pool spend proposal (DAO funding request)
  // protobuf: cosmos.distribution.v1beta1.CommunityPoolSpendProposal
  // { string title = 1; string description = 2; string recipient = 3; repeated Coin amount = 4; }
  // ============================================================
  const CommunityPoolSpendProposal = {
    fromPartial(data) { return data; },
    encode(data) {
      const parts = [
        encodeLenDelim(1, data.title || ''),
        encodeLenDelim(2, data.description || ''),
        encodeLenDelim(3, data.recipient || ''),
      ];
      if (data.amount && Array.isArray(data.amount)) {
        for (const coin of data.amount) {
          parts.push(encodeLenDelim(4, encodeCoin(coin.denom, coin.amount)));
        }
      }
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // MsgCommunityPoolSpend encoding — community pool spend message (the actual execution path for DAO funding requests)
  // protobuf: cosmos.distribution.v1beta1.MsgCommunityPoolSpend
  // { string authority = 1; string recipient = 2; repeated Coin amount = 3; }
  // Note: authority must be the gov module account (on-chain address paxi10d07y265gmmuvt4z0w9aw880jnsr700je7h2vr)
  // ============================================================
  const MsgCommunityPoolSpend = {
    fromPartial(data) { return data; },
    encode(data) {
      const parts = [];
      if (data.authority) parts.push(encodeLenDelim(1, data.authority));
      if (data.recipient) parts.push(encodeLenDelim(2, data.recipient));
      if (data.amount && Array.isArray(data.amount)) {
        for (const coin of data.amount) {
          parts.push(encodeLenDelim(3, encodeCoin(coin.denom, coin.amount)));
        }
      }
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // MsgSubmitProposalV1 encoding — gov v1 submit proposal (carries messages)
  // protobuf: cosmos.gov.v1.MsgSubmitProposal
  // { repeated Any messages = 1; repeated Coin initial_deposit = 2; string proposer = 3;
  //   string metadata = 4; string title = 5; string summary = 6; bool expedited = 7; }
  // Fully isomorphic to the on-chain passed proposal #13 funding proposal.
  // ============================================================
  const MsgSubmitProposalV1 = {
    fromPartial(data) { return data; },
    encode(data) {
      const parts = [];
      if (data.messages && Array.isArray(data.messages)) {
        for (const m of data.messages) {
          parts.push(encodeLenDelim(1, AnyEncode.encode(m).finish()));
        }
      }
      const deposit = data.initial_deposit || data.initialDeposit || [];
      for (const coin of deposit) {
        parts.push(encodeLenDelim(2, encodeCoin(coin.denom, coin.amount)));
      }
      if (data.proposer) parts.push(encodeLenDelim(3, data.proposer));
      if (data.metadata) parts.push(encodeLenDelim(4, data.metadata));
      if (data.title) parts.push(encodeLenDelim(5, data.title));
      if (data.summary) parts.push(encodeLenDelim(6, data.summary));
      if (data.expedited) parts.push(encodeVarintField(7, 1));
      return { finish: () => concatBytes(...parts) };
    },
  };

  // ============================================================
  // Compatibility layer entry: detect and supplement missing classes
  // ============================================================
  function applyCompat() {
    if (typeof window.PaxiCosmJS === 'undefined') {
      console.error('[Compat] PaxiCosmJS not loaded, compatibility layer cannot be applied');
      return;
    }

    const supplement = {
      MsgSend,
      MsgExecuteContract,
      MsgInstantiateContract,
      PubKey,
      coins,
      GenericAuthorization,
      Timestamp,
      Grant,
      MsgGrant,
      MsgExec,
      MsgRevoke,
      MsgUpdateAdmin,
      MsgMigrateContract,
      MsgBeginRedelegate,
      TextProposal,
      ParamChange,
      ParameterChangeProposal,
      CommunityPoolSpendProposal,
      MsgCommunityPoolSpend,
      MsgSubmitProposalV1,
      MsgSubmitProposal,
    };

    let added = [];
    for (const [name, impl] of Object.entries(supplement)) {
      if (typeof window.PaxiCosmJS[name] === 'undefined') {
        window.PaxiCosmJS[name] = impl;
        added.push(name);
      }
    }

    if (added.length > 0) {
      console.log('[Compat] supplemented missing classes:', added.join(', '));
    } else {
      console.log('[Compat] PaxiCosmJS SDK complete, no supplementation needed');
    }
  }

  // Run after DOM is loaded (ensures the SDK has loaded)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCompat);
  } else {
    applyCompat();
  }
})();
