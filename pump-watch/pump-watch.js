#!/usr/bin/env node
// ============================================================
// pump-watch.js —— Paxi Pump token-launch monitor (block-scan version)
// Background: Paxi nodes have disabled transaction indexing (GetTxsEvent unavailable),
//       so we switch to incremental block scanning: from the last checked height to the latest height,
//       filtering transactions "MsgSend to the platform's unified collection address + memo containing fee xx PAXI",
//       and pushing to WeChat via ServerChan (sct.ftqq.com) immediately upon discovery.
//
// Config: .workbuddy/pump-watch.json  ->  { "sendKey": "SCTxxxx" }
// State: .workbuddy/pump-watch-state.json (auto-maintained: last height + pushed hashes)
// Run: node pump-watch.js (can be repeatedly invoked by a scheduler/WorkBuddy cron job; shorter interval = more real-time)
// ============================================================
const fs = require('fs');
const path = require('path');

const LCD = 'https://mainnet-lcd.paxinet.io';
// Collection address: unified with the dApp as the single platform collection address CONFIG.feeCollector
const FEE_RECEIVERS = new Set([
    "paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg"
]);
// Max blocks scanned per run (prevents overly long scans after long downtime; skip the middle section if exceeded)
const MAX_BLOCKS_PER_RUN = 3000;
// Concurrent blocks fetched (too high triggers node 503 rate limiting)
const CONCURRENCY = 6;

const BASE = __dirname;
const CONFIG_FILE = path.join(BASE, '.workbuddy', 'pump-watch.json');
const STATE_FILE = path.join(BASE, '.workbuddy', 'pump-watch-state.json');

function loadJson(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; }
}
function saveJson(file, obj) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

async function fetchJson(url, timeoutMs = 15000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

async function getLatestHeight() {
    const data = await fetchJson(`${LCD}/cosmos/base/tendermint/v1beta1/blocks/latest`);
    return Number(data.block.header.height);
}

// Determine whether a transaction in a block is a token-launch service-fee transaction
function findFeeTxs(blockData) {
    const out = [];
    const bodies = blockData.txs || [];
    const responses = blockData.tx_responses || [];
    responses.forEach((resp, i) => {
        const body = bodies[i] || {};
        const memo = body.memo || '';
        if (!/fee\s+\d+(\.\d+)?\s+PAXI/i.test(memo)) return;
        for (const m of (body.messages || [])) {
            const type = String(m['@type'] || '');
            if (type.includes('MsgSend') && FEE_RECEIVERS.has(m.to_address)) {
                out.push({
                    hash: resp.txhash,
                    memo,
                    to: m.to_address,
                    amount: (m.amount || []).map(a => `${a.amount}${a.denom}`).join(',')
                });
                break;
            }
        }
    });
    return out;
}

// Concurrently fetch all block transactions within a height range; returns { found, failedHeights }
async function scanRange(from, to) {
    const found = [];
    const failedHeights = [];
    for (let start = from; start <= to; start += CONCURRENCY) {
        const end = Math.min(start + CONCURRENCY - 1, to);
        const heights = [];
        for (let h = start; h <= end; h++) heights.push(h);
        const results = await Promise.all(heights.map(async h => {
            // Retry each block up to 3 times with increasing intervals, to withstand node rate limiting
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const data = await fetchJson(`${LCD}/cosmos/tx/v1beta1/txs/block/${h}`);
                    return { ok: true, txs: findFeeTxs(data).map(t => ({ ...t, height: h })) };
                } catch (e) {
                    if (attempt === 3) return { ok: false, h };
                    await new Promise(r => setTimeout(r, 800 * attempt));
                }
            }
        }));
        results.forEach(r => {
            if (r.ok) found.push(...r.txs);
            else failedHeights.push(r.h);
        });
    }
    return { found, failedHeights };
}

async function main() {
    const cfg = loadJson(CONFIG_FILE, {});
    const sendKey = (cfg.sendKey || '').trim();
    const state = loadJson(STATE_FILE, {});

    const latest = await getLatestHeight();
    console.log(`[On-chain latest height] ${latest}`);

    // First run: only record the baseline height, do not backfill history
    if (!state.lastHeight) {
        saveJson(STATE_FILE, { lastHeight: latest, seen: [] });
        console.log(`[First run] baseline height ${latest} established, no push this run`);
        return;
    }

    let from = state.lastHeight + 1;
    let to = latest;
    if (to < from) { console.log('[Result] no new blocks'); return; }
    if (to - from + 1 > MAX_BLOCKS_PER_RUN) {
        console.error(`[Warning] ${to - from + 1} blocks behind, exceeds per-run cap ${MAX_BLOCKS_PER_RUN}, skipping the middle section from ${to - MAX_BLOCKS_PER_RUN + 1}`);
        from = to - MAX_BLOCKS_PER_RUN + 1;
    }

    const { found, failedHeights } = await scanRange(from, to);

    // Deduplicate (by hash) and sort by height ascending
    const seen = new Set(state.seen || []);
    const fresh = found.filter(t => !seen.has(t.hash));

    for (const tx of fresh) {
        const title = '🚀 Someone launched a token! Paxi Pump new order';
        const desp = [
            `**Height**: ${tx.height}`,
            `**Collection address**: ${tx.to}`,
            `**Service fee**: ${tx.amount}`,
            `**Tx hash**: ${tx.hash}`,
            `**Memo**: ${tx.memo}`
        ].join('\n\n');
        if (!sendKey) {
            console.log(`[Not pushed - missing SendKey] height${tx.height} ${tx.hash} ${tx.amount} memo=${tx.memo}`);
            continue;
        }
        try {
            const r = await fetch(`https://sctapi.ftqq.com/${sendKey}.send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, desp })
            });
            const j = await r.json();
            console.log(`[Pushed to WeChat] height${tx.height} ${tx.hash} -> code=${j.code} ${j.message || ''}`);
        } catch (e) {
            console.error(`[Push failed] ${tx.hash}: ${e.message}`);
        }
        seen.add(tx.hash);
    }

    // Update state: keep only the most recent 500 entries in seen;
    // if any block failed to fetch completely, roll the height back to the earliest failed block and auto-rescan next round (hash dedup prevents duplicate pushes)
    state.seen = Array.from(seen).slice(-500);
    if (failedHeights.length) {
        const retryFrom = Math.min(...failedHeights) - 1;
        state.lastHeight = Math.max(retryFrom, state.lastHeight);
        console.error(`[Note] ${failedHeights.length} blocks failed to fetch, will rescan from height ${state.lastHeight + 1} next round`);
    } else {
        state.lastHeight = to;
    }
    saveJson(STATE_FILE, state);

    console.log(fresh.length
        ? `[Result] scanned ${from}-${to}, found ${fresh.length} new token launches`
        : `[Result] scanned ${from}-${to}, no new token launches`);
}

main().catch(e => { console.error('[Monitor error]', e.message); process.exit(1); });
