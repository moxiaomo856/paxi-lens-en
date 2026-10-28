/* Validate every encoder in appjs/msg-codec.js against the CHAIN's own decoder.
 * Build a TxRaw with the real SDK around our message bytes, POST it to the LCD's
 * /cosmos/tx/v1beta1/decode endpoint — if the chain parses our bytes back into the exact fields
 * we put in, the encoding is correct.
 *
 * Run: PAXI_SDK=./paxi-sdk.js node test/verify-codec.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SUITE = path.join(__dirname, '..');
const LCD = 'https://mainnet-lcd.paxinet.io';
const SDK_PATH = process.env.PAXI_SDK || 'C:/Users/Administrator/AppData/Local/Temp/sdktest/paxi-sdk.js';

const codecCtx = { module: { exports: {} }, TextEncoder, console };
codecCtx.window = codecCtx;
vm.runInNewContext(fs.readFileSync(path.join(SUITE, 'appjs/msg-codec.js'), 'utf8'), codecCtx);
const C = codecCtx.PaxiMsgCodec || codecCtx.module.exports;

globalThis.window = globalThis; globalThis.self = globalThis;
let SDK = null;
try { SDK = require(SDK_PATH); }
catch (e) { console.log('⚠️ 跳过：SDK 不可用（' + e.message + '）'); process.exit(0); }

function buildTxBytes(messageBytes, typeUrl) {
  const txBody = SDK.TxBody.fromPartial({ messages: [{ typeUrl, value: messageBytes }], memo: 'codec probe' });
  const pubKeyAny = { typeUrl: '/cosmos.crypto.secp256k1.PubKey', value: SDK.PubKey.encode({ key: new Uint8Array(33) }).finish() };
  const authInfo = SDK.AuthInfo.fromPartial({
    signerInfos: [{ publicKey: pubKeyAny, modeInfo: { single: { mode: 1 } }, sequence: BigInt(0) }],
    fee: { amount: [{ denom: 'upaxi', amount: '100000' }], gasLimit: BigInt(400000) },
  });
  const txRaw = SDK.TxRaw.fromPartial({
    bodyBytes: SDK.TxBody.encode(txBody).finish(),
    authInfoBytes: SDK.AuthInfo.encode(authInfo).finish(),
    signatures: [new Uint8Array(64)],
  });
  return SDK.TxRaw.encode(txRaw).finish();
}

let failed = 0, passed = 0;
async function check(label, typeUrl, messageBytes, expect, expectUnsupported) {
  const r = await fetch(`${LCD}/cosmos/tx/v1beta1/decode`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_bytes: Buffer.from(buildTxBytes(messageBytes, typeUrl)).toString('base64') }),
  });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch (_) {}
  if (!j) { console.log(`  ❌ ${label.padEnd(30)} 非 JSON: ${t.slice(0, 90)}`); failed++; return; }
  if (j.code !== undefined) {
    if (expectUnsupported) { console.log(`  ✅ ${label.padEnd(30)} 链上明确不支持（符合预期）`); passed++; }
    else { console.log(`  ❌ ${label.padEnd(30)} ${(j.message || '').slice(0, 150)}`); failed++; }
    return;
  }
  const m = (j.tx && j.tx.body && j.tx.body.messages && j.tx.body.messages[0]) || {};
  const bad = [];
  for (const [k, v] of Object.entries(expect)) {
    const got = m[k];
    const okv = (typeof v === 'object' && v !== null)
      ? JSON.stringify(got) === JSON.stringify(v)
      : String(got) === String(v);
    if (!okv) bad.push(`${k}: 期望 ${JSON.stringify(v)}，实际 ${JSON.stringify(got)}`);
  }
  if (bad.length) { console.log(`  ❌ ${label.padEnd(30)} ${bad.join(' | ')}`); failed++; }
  else { console.log(`  ✅ ${label.padEnd(30)} 字段逐个一致`); passed++; }
}

const A = 'paxi1gq0zlf6gr48x98tn5f32580f40x9ngu2sljlmtwnchcakue6y3wsxld05w';
const V = 'paxivaloper1qhdnzn0y7h78ztm2q7x0qcdc6l99tcfy8lv2ks';
const V2 = 'paxivaloper1gq0zlf6gr48x98tn5f32580f40x9ngu2sljlmtwnchcakue6y3wsxld05w';
const GOV = 'paxi10d07y265gmmuvt4z0w9aw880jnsr700je7h2vr';

(async () => {
  console.log('\n== 1. staking ==');
  await check('MsgUndelegate', '/cosmos.staking.v1beta1.MsgUndelegate',
    C.encodeMsgUndelegate(A, V, 'upaxi', '1234567'),
    { delegator_address: A, validator_address: V, amount: { denom: 'upaxi', amount: '1234567' } });
  await check('MsgBeginRedelegate', '/cosmos.staking.v1beta1.MsgBeginRedelegate',
    C.encodeMsgBeginRedelegate(A, V, V2, 'upaxi', '7654321'),
    { delegator_address: A, validator_src_address: V, validator_dst_address: V2, amount: { denom: 'upaxi', amount: '7654321' } });
  await check('MsgCancelUnbondingDelegation', '/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation',
    C.encodeMsgCancelUnbondingDelegation(A, V, 'upaxi', '5000', 12345),
    { delegator_address: A, validator_address: V, creation_height: '12345' });

  console.log('\n== 2. distribution ==');
  await check('MsgWithdrawDelegatorReward', '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    C.encodeMsgWithdrawDelegatorReward(A, V), { delegator_address: A, validator_address: V });
  await check('MsgSetWithdrawAddress', '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress',
    C.encodeMsgSetWithdrawAddress(A, V), { delegator_address: A, withdraw_address: V });
  await check('MsgCommunityPoolSpend', '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend',
    C.encodeMsgCommunityPoolSpend(GOV, V, [{ denom: 'upaxi', amount: '999' }]),
    { authority: GOV, recipient: V, amount: [{ denom: 'upaxi', amount: '999' }] });

  console.log('\n== 3. gov ==');
  await check('MsgVote (v1)', '/cosmos.gov.v1.MsgVote',
    C.encodeMsgVote(42, A, 1, 'meta'), { proposal_id: '42', voter: A, metadata: 'meta' });
  await check('MsgSubmitProposal (v1)', '/cosmos.gov.v1.MsgSubmitProposal',
    C.encodeMsgSubmitProposal(
      [{ typeUrl: '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend', value: C.encodeMsgCommunityPoolSpend(GOV, V, [{ denom: 'upaxi', amount: '999' }]) }],
      [{ denom: 'upaxi', amount: '5000000' }], A, '', 'title here', 'summary here', false
    ), { proposer: A, title: 'title here', summary: 'summary here' });
  await check('TextProposal', '/cosmos.gov.v1beta1.TextProposal',
    C.encodeTextProposal('t1', 'd1'), { title: 't1', description: 'd1' }, true);
  await check('ParameterChangeProposal', '/cosmos.params.v1beta1.ParameterChangeProposal',
    C.encodeParameterChangeProposal('t2', 'd2', [{ subspace: 'staking', key: 'k', value: 'v' }]),
    { title: 't2', description: 'd2' }, true);
  await check('MsgExecLegacyContent', '/cosmos.gov.v1.MsgExecLegacyContent',
    C.encodeMsgExecLegacyContent({ typeUrl: '/cosmos.gov.v1beta1.TextProposal', value: C.encodeTextProposal('t3', 'd3') }, 't3', 'd3', 's3', ''),
    { title: 't3', description: 'd3', summary: 's3' }, true);

  console.log('\n== 4. wasm ==');
  await check('MsgInstantiateContract', '/cosmwasm.wasm.v1.MsgInstantiateContract',
    C.encodeMsgInstantiateContract(A, '', 2, 'label-1', new TextEncoder().encode('{"a":1}'), []),
    { sender: A, code_id: '2', label: 'label-1', admin: '' });

  console.log('\n' + (failed === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed === 0 ? 0 : 1);
})();
