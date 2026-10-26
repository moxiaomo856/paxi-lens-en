/**
 * Regression test: v1-style community pool spend proposal (DAO funding request)
 *
 * Basis: the on-chain PASSED proposal #13 (Paxi CosmWasm Game & Lottery Open-Source Template,
 * 188,000 PAXI) uses exactly the gov v1 method:
 *   MsgSubmitProposal(v1) { messages: [ MsgCommunityPoolSpend{authority=gov module account,
 *   recipient, amount} ], initial_deposit, proposer, metadata, title, summary }
 * instead of the legacy content (CommunityPoolSpendProposal is no longer accepted by gov in SDK v0.53).
 *
 * Verification method: build tx -> POST /cosmos/tx/v1beta1/simulate
 *   - reaches signature check ("invalid number of signer") with gas_used > 5000 => encoding correctly parsed
 *   - a wrong typeUrl reports "unable to resolve type URL" at gas≈1159 (negative control)
 *
 * Run: node test/verify-pool-proposal-v1.js
 */
const LCD = process.env.PAXI_LCD || 'https://mainnet-lcd.paxinet.io';

// ---- protobuf base encoding (consistent with compat.js) ----
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
function concatBytes(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) { result.set(arr, offset); offset += arr.length; }
  return result;
}
function encodeLenDelim(fieldNum, data) {
  const tag = (fieldNum << 3) | 2;
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return concatBytes(encodeVarint(tag), encodeVarint(dataBytes.length), dataBytes);
}
function encodeVarintField(fieldNum, value) {
  return concatBytes(encodeVarint((fieldNum << 3) | 0), encodeVarint(value));
}
function encodeCoin(denom, amount) {
  return concatBytes(encodeLenDelim(1, denom), encodeLenDelim(2, amount));
}
function anyEncode(any) {
  return concatBytes(encodeLenDelim(1, any.typeUrl), encodeLenDelim(2, any.value));
}
// cosmos.distribution.v1beta1.MsgCommunityPoolSpend
// { string authority = 1; string recipient = 2; repeated Coin amount = 3; }
function msgCommunityPoolSpendEncode(data) {
  const parts = [];
  if (data.authority) parts.push(encodeLenDelim(1, data.authority));
  if (data.recipient) parts.push(encodeLenDelim(2, data.recipient));
  for (const coin of (data.amount || [])) {
    parts.push(encodeLenDelim(3, encodeCoin(coin.denom, coin.amount)));
  }
  return concatBytes(...parts);
}
// cosmos.gov.v1.MsgSubmitProposal
// { repeated Any messages = 1; repeated Coin initial_deposit = 2; string proposer = 3;
//   string metadata = 4; string title = 5; string summary = 6; bool expedited = 7; }
function msgSubmitProposalV1Encode(data) {
  const parts = [];
  for (const m of (data.messages || [])) {
    parts.push(encodeLenDelim(1, anyEncode(m)));
  }
  for (const coin of (data.initial_deposit || [])) {
    parts.push(encodeLenDelim(2, encodeCoin(coin.denom, coin.amount)));
  }
  if (data.proposer) parts.push(encodeLenDelim(3, data.proposer));
  if (data.metadata) parts.push(encodeLenDelim(4, data.metadata));
  if (data.title) parts.push(encodeLenDelim(5, data.title));
  if (data.summary) parts.push(encodeLenDelim(6, data.summary));
  if (data.expedited) parts.push(encodeVarintField(7, 1));
  return concatBytes(...parts);
}
function txBodyEncode(messages, memo) {
  const parts = [];
  for (const m of messages) parts.push(encodeLenDelim(1, anyEncode(m)));
  if (memo) parts.push(encodeLenDelim(2, memo));
  return concatBytes(...parts);
}
function authInfoEncode(fee) {
  const feeParts = [];
  for (const c of (fee.amount || [])) feeParts.push(encodeLenDelim(1, encodeCoin(c.denom, c.amount)));
  feeParts.push(encodeVarintField(2, fee.gasLimit));
  return encodeLenDelim(2, concatBytes(...feeParts));
}
function txRawEncode(bodyBytes, authInfoBytes, signatures) {
  const parts = [encodeLenDelim(1, bodyBytes), encodeLenDelim(2, authInfoBytes)];
  for (const s of signatures) parts.push(encodeLenDelim(3, s));
  return concatBytes(...parts);
}

async function simulate(label, submitMsg) {
  const bodyBytes = txBodyEncode([submitMsg], 'simulate probe');
  const authInfoBytes = authInfoEncode({ amount: [{ denom: 'upaxi', amount: '0' }], gasLimit: 0 });
  const txBytes = txRawEncode(bodyBytes, authInfoBytes, [new Uint8Array()]);
  const res = await fetch(`${LCD}/cosmos/tx/v1beta1/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_bytes: Buffer.from(txBytes).toString('base64') }),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) {}
  const msgText = data?.message || text.slice(0, 300);
  const gas = Number((msgText.match(/gas used: '(\d+)'/) || [])[1] || 0);
  const unresolved = /unable to resolve type URL/.test(msgText);
  const signCheck = /invalid number of signer/.test(msgText);
  console.log(`\n== ${label} ==`);
  console.log('  HTTP', res.status, '| gas:', gas, '| unresolved:', unresolved, '| reached-sigcheck:', signCheck);
  console.log('  msg:', msgText.slice(0, 190));
  return { gas, unresolved, signCheck, msgText };
}

// Real on-chain data (proposal #13 golden sample)
const DENOM = 'upaxi';
const GOV_AUTH = 'paxi10d07y265gmmuvt4z0w9aw880jnsr700je7h2vr';
const RECIPIENT = 'paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg';

function buildSubmit(typeUrl, spendTypeUrl, amountMicro) {
  const spend = {
    typeUrl: spendTypeUrl,
    value: msgCommunityPoolSpendEncode({
      authority: GOV_AUTH,
      recipient: RECIPIENT,
      amount: [{ denom: DENOM, amount: amountMicro }],
    }),
  };
  return {
    typeUrl,
    value: msgSubmitProposalV1Encode({
      messages: [spend],
      initial_deposit: [{ denom: DENOM, amount: '30000000' }], // 30 PAXI (consistent with #13)
      proposer: RECIPIENT,
      metadata: 'https://github.com/moxiaomo856/paxi-dao-proposal/blob/main/proposal.md',
      title: 'Paxi CosmWasm Game & Lottery Open-Source Template + Invisible-UX Starter (188,000 PAXI)',
      summary: 'Extract validated game and lottery contracts into Paxi first open-source MIT CosmWasm template.',
      expedited: false,
    }),
  };
}

(async () => {
  let failures = 0;

  // 1) Correct v1 method (isomorphic to #13, amount 188,000 PAXI)
  const good = await simulate('v1 MsgSubmitProposal + MsgCommunityPoolSpend (mirrors passed #13)',
    buildSubmit('/cosmos.gov.v1.MsgSubmitProposal', '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend', '188000000000'));

  // 2) Negative control: wrong typeUrl
  const bad = await simulate('NEGATIVE control (wrong MsgCommunityPoolSpend typeUrl)',
    buildSubmit('/cosmos.gov.v1.MsgSubmitProposal', '/cosmos.distribution.v1beta1.MsgCommunityPoolSpendXX', '188000000000'));

  // 3) Negative control: wrong submit typeUrl
  const bad2 = await simulate('NEGATIVE control (wrong MsgSubmitProposal typeUrl)',
    buildSubmit('/cosmos.gov.v1.MsgSubmitProposalXX', '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend', '188000000000'));

  console.log('\n---------------- Result ----------------');
  if (!(good.gas > 5000 && good.signCheck && !good.unresolved)) {
    console.log('❌ v1 method not correctly parsed on-chain'); failures++;
  } else {
    console.log('✅ v1 MsgSubmitProposal + MsgCommunityPoolSpend encoding correctly recognized on-chain (reached signature check)');
  }
  if (!(bad.unresolved && bad.gas < 5000)) { console.log('❌ negative control 1 abnormal'); failures++; }
  else console.log('✅ negative control 1 failed as expected (typeUrl unresolvable)');
  if (!(bad2.unresolved && bad2.gas < 5000)) { console.log('❌ negative control 2 abnormal'); failures++; }
  else console.log('✅ negative control 2 failed as expected (typeUrl unresolvable)');

  if (failures) { console.log('\nRESULT: FAIL'); process.exit(1); }
  console.log('\nRESULT: PASS');
})();
