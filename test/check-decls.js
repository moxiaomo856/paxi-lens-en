/* Check whether top-level declarations of all paxi-suite scripts conflict across files (browsers load same-named const/function in order, which would overwrite or error) */
const fs = require('fs');
const path = require('path');

const SUITE = path.join(__dirname, '..');
const scripts = [
  'shared.js', 'compat.js', 'decoder-core.js',
  'appjs/core.js',
  'appjs/tools/batch-transfer.js', 'appjs/tools/balance-check.js', 'appjs/tools/tx-gas.js',
  'appjs/tools/address-convert.js', 'appjs/tools/validator-compare.js', 'appjs/tools/redelegate.js',
  'appjs/tools/proposal.js', 'appjs/tools/decoder.js', 'appjs/tools/pump.js', 'appjs/tools/burn.js',
  'appjs/tools/nft-launcher.js', 'appjs/tools/my-nfts.js', 'appjs/tools/nft-market.js', 'app.js',
  'appjs/tools/claim-rewards.js', 'appjs/tools/gov-vote.js', 'appjs/tools/stake-manage.js',
  'appjs/tools/address-book.js', 'appjs/tools/ibc-query.js', 'appjs/tools/tx-dryrun.js',
  'appjs/tools/allowance.js', 'appjs/tools/swap.js',
];

const decls = new Map();  // name -> file
let conflicts = 0;

for (const f of scripts) {
  const src = fs.readFileSync(path.join(SUITE, f), 'utf8');
  // Top-level declarations: leading const/let/var/function (coarse-grained, enough to catch merge conflicts)
  const re = /^(?:const|let|var|function|async function)\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of src.matchAll(re)) {
    const name = m[1];
    // Declarations inside an IIFE won't match ^ (unless code formatting is abnormal); only leading-line ones count here
    if (decls.has(name)) {
      console.log(`  CONFLICT  ${name}  ${decls.get(name)} <-> ${f}`);
      conflicts++;
    } else {
      decls.set(name, f);
    }
  }
}

console.log(`\nTotal top-level declarations: ${decls.size}`);
console.log(conflicts ? `Conflicts: ${conflicts} (need fixing)` : 'No cross-file declaration conflicts ✓');
process.exit(conflicts ? 1 : 0);
