/* Decisive validation of the hand-written MsgWithdrawDelegatorReward encoder.
 *
 * The Paxi CosmJS bundle has the staking module but not cosmos.distribution, so the SDK cannot
 * encode that message. We encode it by hand. To PROVE the bytes are right we let the REAL SDK
 * build the surrounding TxBody/AuthInfo/TxRaw around our message bytes and hand the result to
 * the chain (/simulate with tx_bytes):
 *   - chain says "tx parse error"  -> our bytes are wrong
 *   - chain reaches business logic  -> our bytes are byte-correct
 */
const path = require('path');
const LCD = 'https://mainnet-lcd.paxinet.io';
const SDK_PATH = process.env.PAXI_SDK || '/tmp/paxi-sdk.js';

const DELEGATOR = 'paxi1gq0zlf6gr48x98tn5f32580f40x9ngu2sljlmtwnchcakue6y3wsxld05w';
const VALIDATOR = 'paxivaloper1qhdnzn0y7h78ztm2q7x0qcdc6l99tcfy8lv2ks';

/* ---- the encoder we ship in appjs/tools/claim-rewards.js ---- */
function encodeWithdrawDelegatorReward(delegator, validator) {
  const enc = new TextEncoder();
  const chunks = [];
  const pushString = (field, s) => {
    const b = enc.encode(s || '');
    const len = [];
    let v = b.length;
    do { let x = v & 0x7f; v >>>= 7; if (v > 0) x |= 0x80; len.push(x); } while (v > 0);
    chunks.push(new Uint8Array([(field << 3) | 2]), new Uint8Array(len), b);
  };
  pushString(1, delegator);
  pushString(2, validator);
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

(async () => {
  console.log('1) 加载 SDK: ' + SDK_PATH);
  let PaxiCosmJS;
  try {
    globalThis.window = globalThis; globalThis.self = globalThis;
    PaxiCosmJS = require(SDK_PATH);
  } catch (e) {
    console.log('   ⚠️ 跳过：SDK 不可用（' + e.message + '）。');
    console.log('      把 paxi-cosmjs.umd.js 放到本机并设置 PAXI_SDK 环境变量即可运行本校验：');
    console.log('      curl -o paxi-sdk.js https://mainnet-api.paxinet.io/resources/js/paxi-cosmjs.umd.js');
    console.log('      PAXI_SDK=./paxi-sdk.js node test/verify-msg-encoding.js');
    process.exit(0);
  }
  const keys = Object.keys(PaxiCosmJS || {});
  console.log('   导出项数: ' + keys.length);
  const hasWithdraw = !!PaxiCosmJS.MsgWithdrawDelegatorReward;
  console.log('   MsgWithdrawDelegatorReward 存在? ' + (hasWithdraw ? '✅ 有' : '❌ 没有（这就是领取奖励失败的原因）'));
  console.log('   MsgDelegate 存在? ' + (PaxiCosmJS.MsgDelegate ? '✅' : '❌'));
  const distKeys = keys.filter(k => /Withdraw|Distribution|Commission|CommunityPool/i.test(k));
  console.log('   distribution 相关导出: ' + (distKeys.length ? distKeys.join(', ') : '（空 —— 整个 distribution 模块都没打包）'));

  console.log('\n2) 用真实 SDK 构造外层交易，只把消息字节换成我们手写的版本');
  const ourMsg = encodeWithdrawDelegatorReward(DELEGATOR, VALIDATOR);
  console.log('   我们手写的消息: ' + ourMsg.length + ' 字节');

  const txBody = PaxiCosmJS.TxBody.fromPartial({
    messages: [{
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      value: ourMsg,
    }],
    memo: 'paxi-lens encoding probe',
  });

  const pubKeyBytes = new Uint8Array(33); pubKeyBytes[0] = 2;
  const pubKeyAny = {
    typeUrl: '/cosmos.crypto.secp256k1.PubKey',
    value: PaxiCosmJS.PubKey.encode({ key: pubKeyBytes }).finish(),
  };
  const authInfo = PaxiCosmJS.AuthInfo.fromPartial({
    signerInfos: [{
      publicKey: pubKeyAny,
      modeInfo: { single: { mode: 1 } },
      sequence: BigInt(0),
    }],
    fee: { amount: [{ denom: 'upaxi', amount: '100000' }], gasLimit: BigInt(400000) },
  });
  const txRaw = PaxiCosmJS.TxRaw.fromPartial({
    bodyBytes: PaxiCosmJS.TxBody.encode(txBody).finish(),
    authInfoBytes: PaxiCosmJS.AuthInfo.encode(authInfo).finish(),
    signatures: [new Uint8Array(64)],
  });
  const txBytes = PaxiCosmJS.TxRaw.encode(txRaw).finish();
  console.log('   完整 tx: ' + txBytes.length + ' 字节');

  console.log('\n3) 交给链上解析（simulate + tx_bytes）');
  const res = await fetch(`${LCD}/cosmos/tx/v1beta1/simulate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_bytes: toBase64(txBytes), signatures: [''] }),
  });
  const t = await res.text();
  console.log('   -> ' + t.slice(0, 400).replace(/\s+/g, ' '));

  console.log('\n4) 再用链上解码器 (/decode) 读回字段，确认值完全正确');
  const res2 = await fetch(`${LCD}/cosmos/tx/v1beta1/decode`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_bytes: toBase64(txBytes) }),
  });
  const t2 = await res2.text();
  let j = null; try { j = JSON.parse(t2); } catch (_) {}
  if (j && j.tx && j.tx.body && j.tx.body.messages) {
    const m = j.tx.body.messages[0] || {};
    console.log('   解码结果: ' + JSON.stringify(m).slice(0, 300));
    const okType = String(m['@type'] || '').includes('MsgWithdrawDelegatorReward');
    const okDel = m.delegator_address === DELEGATOR;
    const okVal = m.validator_address === VALIDATOR;
    console.log('   type_url  : ' + (okType ? '✅' : '❌') + ' ' + (m['@type'] || ''));
    console.log('   delegator : ' + (okDel ? '✅' : '❌') + ' ' + m.delegator_address);
    console.log('   validator : ' + (okVal ? '✅' : '❌') + ' ' + m.validator_address);
    if (okType && okDel && okVal) {
      console.log('\n✅ 结论：手写编码通过链上解码器逐字段校验，可以安全上线');
      process.exit(0);
    }
    console.log('\n❌ 字段不一致，不能上线');
    process.exit(1);
  }
  console.log('   /decode 返回: ' + t2.slice(0, 240).replace(/\s+/g, ' '));
  const parseFail = t.includes('parse error') || t2.includes('parse error');
  console.log('\n' + (parseFail ? '❌ 字节解析失败' : '⚠️ 未拿到字段，请人工确认上面 simulate 的输出'));
  process.exit(parseFail ? 1 : 2);
})();
