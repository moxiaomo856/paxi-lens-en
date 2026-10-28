/* Regression test — the hand-written protobuf encoder for
 * cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward.
 *
 * Why it exists: the Paxi CosmJS bundle ships the staking module but NOT cosmos.distribution,
 * so PaxiCosmJS.MsgWithdrawDelegatorReward does not exist and the "claim rewards" tool could
 * not build its transaction at all ("SDK 不支持此訊息類型"). We encode that message by hand.
 *
 * The golden vector below was validated against the chain's OWN decoder
 * (LCD /cosmos/tx/v1beta1/decode) and against /simulate — see test/verify-msg-encoding.js.
 *
 * Proto:  message MsgWithdrawDelegatorReward {
 *           string delegator_address = 1;   // tag 0x0A
 *           string validator_address = 2;   // tag 0x12
 *         }
 *
 * Run: node test/claim-msg-encoding.test.js
 */
const fs = require('fs');
const path = require('path');

const SUITE = path.join(__dirname, '..');

// ---- the encoder exactly as it is shipped in appjs/tools/claim-rewards.js ----
function _crEncodeWithdrawDelegatorReward(delegator, validator) {
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

// ---- and the shipped one must be byte-identical to the copy under test ----
function extractShipped() {
  const src = fs.readFileSync(path.join(SUITE, 'appjs/tools/claim-rewards.js'), 'utf8');
  const start = src.indexOf('function _crEncodeWithdrawDelegatorReward(');
  if (start < 0) throw new Error('encoder not found in appjs/tools/claim-rewards.js');
  let depth = 0, opened = false, quote = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') { depth++; opened = true; }
    else if (c === '}') { depth--; if (opened && depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error('unbalanced braces');
}

let failed = 0, passed = 0;
const ok = (cond, label, extra) => {
  if (cond) { passed++; console.log('  PASS  ' + label); }
  else { failed++; console.log('  FAIL  ' + label + (extra ? '  -> ' + extra : '')); }
};

console.log('\n== A. 黄金向量（链上解码器校验过的字节）==');
const golden = Buffer.from(_crEncodeWithdrawDelegatorReward('paxi1abc', 'paxivaloper1xyz')).toString('hex');
ok(golden === '0a087061786931616263120f7061786976616c6f7065723178797a',
   '固定输入 -> 预期字节', golden);

console.log('\n== B. 线格式细节 ==');
const enc = _crEncodeWithdrawDelegatorReward('paxi1abc', 'paxivaloper1xyz');
ok(enc[0] === 0x0A, 'field 1 使用 tag 0x0A (string, wire type 2)', '0x' + enc[0].toString(16));
ok(enc[1] === 8, 'delegator 长度为 varint', String(enc[1]));
ok(Buffer.from(enc.subarray(2, 10)).toString() === 'paxi1abc', 'delegator 内容正确');
ok(enc[10] === 0x12, 'field 2 使用 tag 0x12 (string, wire type 2)', '0x' + enc[10].toString(16));
ok(enc[11] === 15, 'validator 长度为 varint', String(enc[11]));
ok(Buffer.from(enc.subarray(12, 27)).toString() === 'paxivaloper1xyz', 'validator 内容正确');
ok(enc.length === 27, '总长度 = 1+1+8 + 1+1+15', String(enc.length));

console.log('\n== C. 边界情况 ==');
const empty = _crEncodeWithdrawDelegatorReward('', '');
ok(empty.length === 4 && empty[0] === 0x0A && empty[1] === 0 && empty[2] === 0x12 && empty[3] === 0,
   '空字符串也能编码（不抛异常）', Buffer.from(empty).toString('hex'));
const long = _crEncodeWithdrawDelegatorReward('a'.repeat(200), 'b');
ok(long[1] === 0xC8 && long[2] === 0x01, '长度 >= 128 时使用多字节 varint', '0x' + long[1].toString(16) + long[2].toString(16));
ok(Buffer.from(long.subarray(3, 203)).toString() === 'a'.repeat(200), '长字符串内容正确');
ok(_crEncodeWithdrawDelegatorReward(undefined, null).length === 4, 'undefined/null 不抛异常');

console.log('\n== D. 上线版本与测试版本一致 ==');
try {
  const shipped = extractShipped();
  const shippedFn = new Function('TextEncoder', 'return (' + shipped + ')')(TextEncoder);
  const a = Buffer.from(shippedFn('paxi1abc', 'paxivaloper1xyz')).toString('hex');
  const b = Buffer.from(_crEncodeWithdrawDelegatorReward('paxi1abc', 'paxivaloper1xyz')).toString('hex');
  ok(a === b, 'appjs/tools/claim-rewards.js 里的编码器输出完全一致', a + ' vs ' + b);
} catch (e) {
  ok(false, '提取上线编码器', e.message);
}

console.log('\n' + (failed === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed === 0 ? 0 : 1);
