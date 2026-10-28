/* Audit every message construction in the app against the REAL SDK field names.
 *
 * Root cause found (2026-10-28): PaxiCosmJS.MsgDelegate uses camelCase field names
 * (delegatorAddress / validatorAddress). The app passed snake_case (delegator_address), and
 * ts-proto's fromPartial() SILENTLY IGNORES unknown fields -> the encoded message went out with
 * EMPTY addresses -> the chain answered "empty address string is not allowed".
 *
 * This script loads the real SDK, finds every `X.fromPartial({...})` in the sources and reports
 * which keys the SDK does not know about.
 *
 * Run: PAXI_SDK=./paxi-sdk.js node test/audit-msg-fields.js
 */
const fs = require('fs');
const path = require('path');

const SUITE = path.join(__dirname, '..');
const SDK_PATH = process.env.PAXI_SDK || 'C:/Users/Administrator/AppData/Local/Temp/sdktest/paxi-sdk.js';

globalThis.window = globalThis; globalThis.self = globalThis;
let S;
try { S = require(SDK_PATH); }
catch (e) {
  console.log('⚠️ 跳过：SDK 不可用（' + e.message + '）');
  process.exit(0);
}

// field names of every SDK message class
const known = new Map();
for (const k of Object.keys(S)) {
  const cls = S[k];
  if (!cls || typeof cls.fromPartial !== 'function') continue;
  try {
    const sample = cls.fromPartial({});
    known.set(k, new Set(Object.keys(sample || {})));
  } catch (_) {}
}
console.log('SDK 消息类数量: ' + known.size + '\n');

// find every fromPartial({...}) in the sources that index.html actually loads
// (tools that were taken offline are not loaded -> not our problem)
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'public' || e.name === 'node_modules' || e.name === '.git' || e.name === '.workbuddy') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js') && !p.includes(path.join('test', ''))) files.push(p);
  }
})(SUITE);

const indexHtml = fs.readFileSync(path.join(SUITE, 'index.html'), 'utf8');
const loaded = new Set();
for (const m of indexHtml.matchAll(/<script src="([^"]+)"><\/script>/g)) {
  const s = m[1];
  if (s.startsWith('http')) continue;
  loaded.add(path.resolve(SUITE, s).toLowerCase());
}
const offline = files.filter(f => !loaded.has(path.resolve(f).toLowerCase()));
if (offline.length) {
  console.log('未加载（已下线）的脚本，跳过: ' + offline.map(f => path.basename(f)).join(', ') + '\n');
}
const activeFiles = files.filter(f => loaded.has(path.resolve(f).toLowerCase()));

let issues = 0, checked = 0;
for (const file of activeFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /PaxiCosmJS\.(\w+)\.fromPartial\(\s*\{/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const cls = m[1];
    // capture the object literal (balanced braces)
    let i = src.indexOf('{', m.index + m[0].length - 1), depth = 0, end = -1, quote = null;
    for (let j = i; j < src.length; j++) {
      const c = src[j];
      if (quote) { if (c === '\\') { j++; continue; } if (c === quote) quote = null; continue; }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = j; break; } }
    }
    if (end < 0) continue;
    // strip comments so that words like "NOTE:" inside a comment are not mistaken for keys
    const body = src.slice(i, end + 1)
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
    // TOP-LEVEL keys only (nested object keys belong to other classes)
    const topKeys = [];
    let d = 0, q = null;
    for (let j = 1; j < body.length - 1; j++) {
      const c = body[j];
      if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; }
      if (c === '"' || c === "'" || c === '`') { q = c; continue; }
      if (c === '{' || c === '[') { d++; continue; }
      if (c === '}' || c === ']') { d--; continue; }
      if (d === 0) {
        const km = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(body.slice(j));
        if (km) { topKeys.push(km[1]); j += km[1].length; }
      }
    }
    const keys = topKeys.filter(k => !['denom', 'amount'].includes(k)); // Coin fields identical in both conventions
    if (!known.has(cls)) { console.log(`  ?  ${cls}（SDK 无此类，跳过）`); continue; }
    checked++;
    const bad = keys.filter(k => !known.get(cls).has(k));
    const line = src.slice(0, m.index).split('\n').length;
    if (bad.length) {
      issues++;
      const good = [...known.get(cls)].filter(k => /address|validator|delegator|authority|description/i.test(k));
      console.log(`  ❌ ${path.relative(SUITE, file)}:${line}  ${cls}.fromPartial({ ${bad.join(', ')} })`);
      console.log(`       SDK 真实字段: ${good.join(', ') || '[...]'}`);
    }
  }
}
console.log(`\n检查 ${checked} 处消息构造，发现 ${issues} 处字段名不匹配。`);
process.exit(issues ? 1 : 0);
