/**
 * Paxi Lens — minimal protobuf encoders for message types the Paxi CosmJS bundle does NOT export.
 *
 * Why this file exists (2026-10-28):
 *   The chain's cosmjs bundle (paxi-cosmjs.umd.js) exports only 18 names, and its message classes
 *   are limited to: MsgSend / MsgVote / MsgDelegate / MsgExecuteContract (+3 AMM msgs).
 *   Classes such as MsgUndelegate, MsgBeginRedelegate, MsgWithdrawDelegatorReward,
 *   MsgSubmitProposal, MsgInstantiateContract are NOT exported, so the tools that need them could
 *   never build a transaction. In addition the exported classes use camelCase field names
 *   (delegatorAddress), while the tools used snake_case — and ts-proto's fromPartial() silently
 *   ignores unknown fields, so the chain received EMPTY addresses ("empty address string is not
 *   allowed").
 *
 *   Everything here is plain protobuf wire format, verified byte-for-byte against the chain's own
 *   decoder (LCD /cosmos/tx/v1beta1/decode) — see test/verify-codec.js.
 *
 * Loaded from index.html right after shared.js. If this file fails to load the tools degrade with
 * a clear message instead of a ReferenceError.
 */
(function (global) {
  'use strict';

  // ---------- minimal protobuf writer ----------
  function varintBytes(n) {
    const out = [];
    let v = n;
    do {
      let b = v & 0x7f;
      v = Math.floor(v / 128);
      if (v > 0) b |= 0x80;
      out.push(b);
    } while (v > 0);
    return out;
  }
  function tagBytes(field, wire) { return varintBytes(field * 8 + wire); }

  function bytesField(field, bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || 0);
    return concat([new Uint8Array(tagBytes(field, 2)), new Uint8Array(varintBytes(b.length)), b]);
  }
  function strField(field, s) {
    return bytesField(field, new TextEncoder().encode(s == null ? '' : String(s)));
  }
  function varintField(field, n) {
    return concat([new Uint8Array(tagBytes(field, 0)), new Uint8Array(varintBytes(n))]);
  }
  function boolField(field, v) { return varintField(field, v ? 1 : 0); }
  function concat(parts) {
    let total = 0;
    for (const p of parts) total += p.length;
    const out = new Uint8Array(total);
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }
  // Coin { string denom = 1; string amount = 2; }
  function coinBytes(denom, amount) {
    return concat([strField(1, denom || ''), strField(2, amount == null ? '' : String(amount))]);
  }
  // repeated Coin -> field N (repeated length-delimited)
  function coinsField(field, coins) {
    const parts = [];
    for (const c of (coins || [])) parts.push(bytesField(field, coinBytes(c.denom, c.amount)));
    return concat(parts);
  }
  // google.protobuf.Any { string type_url = 1; bytes value = 2; }
  function anyBytes(typeUrl, value) {
    return concat([strField(1, typeUrl), bytesField(2, value || new Uint8Array(0))]);
  }

  // ---------- message encoders ----------
  /**
   * cosmos.staking.v1beta1.MsgUndelegate
   *   string delegator_address = 1; string validator_address = 2; Coin amount = 3;
   */
  function encodeMsgUndelegate(delegatorAddress, validatorAddress, denom, amount) {
    return concat([
      strField(1, delegatorAddress),
      strField(2, validatorAddress),
      bytesField(3, coinBytes(denom, amount)),
    ]);
  }

  /**
   * cosmos.staking.v1beta1.MsgBeginRedelegate
   *   string delegator_address = 1; string validator_src_address = 2;
   *   string validator_dst_address = 3; Coin amount = 4;
   */
  function encodeMsgBeginRedelegate(delegatorAddress, validatorSrcAddress, validatorDstAddress, denom, amount) {
    return concat([
      strField(1, delegatorAddress),
      strField(2, validatorSrcAddress),
      strField(3, validatorDstAddress),
      bytesField(4, coinBytes(denom, amount)),
    ]);
  }

  /**
   * cosmos.staking.v1beta1.MsgCancelUnbondingDelegation
   *   string delegator_address = 1; string validator_address = 2; Coin amount = 3;
   *   int64 creation_height = 4;
   */
  function encodeMsgCancelUnbondingDelegation(delegatorAddress, validatorAddress, denom, amount, creationHeight) {
    return concat([
      strField(1, delegatorAddress),
      strField(2, validatorAddress),
      bytesField(3, coinBytes(denom, amount)),
      varintField(4, creationHeight || 0),
    ]);
  }

  /**
   * cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward
   *   string delegator_address = 1; string validator_address = 2;
   */
  function encodeMsgWithdrawDelegatorReward(delegatorAddress, validatorAddress) {
    return concat([strField(1, delegatorAddress), strField(2, validatorAddress)]);
  }

  /**
   * cosmos.distribution.v1beta1.MsgSetWithdrawAddress
   *   string delegator_address = 1; string withdraw_address = 2;
   */
  function encodeMsgSetWithdrawAddress(delegatorAddress, withdrawAddress) {
    return concat([strField(1, delegatorAddress), strField(2, withdrawAddress)]);
  }

  /**
   * cosmos.distribution.v1beta1.MsgCommunityPoolSpend
   *   string authority = 1; string recipient = 2; repeated Coin amount = 3;
   */
  function encodeMsgCommunityPoolSpend(authority, recipient, coins) {
    return concat([strField(1, authority), strField(2, recipient), coinsField(3, coins)]);
  }

  /**
   * cosmos.gov.v1.MsgSubmitProposal
   *   repeated Any messages = 1; repeated Coin initial_deposit = 2; string proposer = 3;
   *   string metadata = 4; string title = 5; string summary = 6; bool expedited = 7;
   *   string authority = 8;   <-- NOT present on this chain (older gov v1 layout) -> omitted when empty
   */
  function encodeMsgSubmitProposal(messages, initialDeposit, proposer, metadata, title, summary, expedited, authority) {
    const msgParts = [];
    // each entry is a google.protobuf.Any -> { typeUrl, value }
    for (const m of (messages || [])) {
      msgParts.push(bytesField(1, (m && m.typeUrl !== undefined)
        ? anyBytes(m.typeUrl, m.value)
        : (m || new Uint8Array(0))));
    }
    const parts = [
      concat(msgParts),
      coinsField(2, initialDeposit),
      strField(3, proposer),
      strField(4, metadata),
      strField(5, title),
      strField(6, summary),
      boolField(7, !!expedited),
    ];
    if (authority) parts.push(strField(8, authority));
    return concat(parts);
  }

  /**
   * cosmos.wasm.v1.MsgInstantiateContract
   *   string sender = 1; string admin = 2; uint64 code_id = 3; string label = 4;
   *   bytes msg = 5; repeated Coin funds = 6;
   */
  function encodeMsgInstantiateContract(sender, admin, codeId, label, msgBytes, funds) {
    return concat([
      strField(1, sender),
      strField(2, admin),
      varintField(3, codeId || 0),
      strField(4, label),
      bytesField(5, msgBytes || new Uint8Array(0)),
      coinsField(6, funds),
    ]);
  }

  /**
   * cosmos.gov.v1.MsgVote
   *   uint64 proposal_id = 1; string voter = 2; VoteOption option = 3; string metadata = 4;
   */
  function encodeMsgVote(proposalId, voter, option, metadata) {
    return concat([
      varintField(1, proposalId || 0),
      strField(2, voter),
      varintField(3, option || 0),
      strField(4, metadata),
    ]);
  }

  /**
   * cosmos.gov.v1.MsgExecLegacyContent — the gov v1 way to submit legacy content
   *   google.protobuf.Any content = 1; string title = 2; string description = 3;
   *   string summary = 4; string metadata = 5;
   */
  function encodeMsgExecLegacyContent(contentAny, title, description, summary, metadata) {
    return concat([
      bytesField(1, contentAny ? anyBytes(contentAny.typeUrl, contentAny.value) : new Uint8Array(0)),
      strField(2, title),
      strField(3, description),
      strField(4, summary),
      strField(5, metadata),
    ]);
  }

  /**
   * cosmos.gov.v1beta1.TextProposal { string title = 1; string description = 2; }
   */
  function encodeTextProposal(title, description) {
    return concat([strField(1, title), strField(2, description)]);
  }

  /**
   * cosmos.params.v1beta1.ParameterChangeProposal
   *   string title = 1; string description = 2; repeated ParamChange changes = 3;
   * ParamChange { string subspace = 1; string key = 2; string value = 3; }
   */
  function encodeParameterChangeProposal(title, description, changes) {
    const parts = [strField(1, title), strField(2, description)];
    for (const c of (changes || [])) {
      parts.push(bytesField(3, concat([strField(1, c.subspace), strField(2, c.key), strField(3, c.value)])));
    }
    return concat(parts);
  }

  const api = {
    // low level helpers (exposed for tests)
    varintBytes, tagBytes, bytesField, strField, varintField, boolField, concat,
    coinBytes, coinsField, anyBytes,
    // messages
    encodeMsgUndelegate, encodeMsgBeginRedelegate, encodeMsgCancelUnbondingDelegation,
    encodeMsgWithdrawDelegatorReward, encodeMsgSetWithdrawAddress, encodeMsgCommunityPoolSpend,
    encodeMsgSubmitProposal, encodeMsgInstantiateContract, encodeMsgVote,
    encodeMsgExecLegacyContent, encodeTextProposal, encodeParameterChangeProposal,
  };

  global.PaxiMsgCodec = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
