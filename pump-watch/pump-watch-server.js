#!/usr/bin/env node
// ============================================================
// pump-watch-server.js —— Paxi Pump token-launch monitor (cloud resident version)
// Runs persistently as a single-port HTTP service: the process stays alive and internally scans the Paxi chain
// once every 10 minutes, pushing to WeChat (ServerChan) when someone launches a token via pump.
// Independent of the local machine's on/off state; deploy to the cloud for 7x24 operation.
//
// Configure sendKey (choose one):
//   1) environment variable PUMP_WATCH_SENDKEY=SCTxxxx
//   2) after deployment, run once: curl -X POST <url>/config -H 'Content-Type: application/json' -d '{"sendKey":"SCTxxxx"}'
// State (last height + pushed hashes + sendKey) is persisted in pump-state.json
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const LCD = 'https://mainnet-lcd.paxinet.io';
// Collection address: unified with the dApp as the single platform collection address CONFIG.feeCollector
const FEE_RECEIVERS = new Set([
    "paxi1rdarmm997hqwfdgl9wvnpffe28zmex3kfyg7xd"
]);
const MAX_BLOCKS_PER_RUN = 3000;   // Max blocks scanned per run (skip the middle section when downtime is too long)
const CONCURRENCY = 6;             // Concurrent blocks fetched (too high triggers node 503 rate limiting)
const SCAN_INTERVAL_MS = (Number(process.env.PUMP_WATCH_INTERVAL) || 5) * 60 * 1000; // Default scan once every 5 minutes (override with env var PUMP_WATCH_INTERVAL, unit: minutes)

const STATE_FILE = process.env.PUMP_WATCH_STATE || path.join(__dirname, 'pump-state.json');

function loadState() {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) { return {}; }
}
function saveState(s) {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
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

let lastScan = { at: 0, scanned: '0-0', found: 0, pushed: 0, error: null };

async function runScan() {
    const state = loadState();
    const sendKey = (state.sendKey || process.env.PUMP_WATCH_SENDKEY || '').trim();
    const result = { scanned: '0-0', found: 0, pushed: 0, error: null };
    try {
        const latest = await getLatestHeight();
        // First run: only record the baseline height, do not backfill history
        if (!state.lastHeight) {
            saveState({ ...state, lastHeight: latest, seen: [] });
            console.log(`[First run] baseline height ${latest} established, no push this run`);
            lastScan = { at: Date.now(), scanned: `${latest}-${latest}`, found: 0, pushed: 0, error: 'baseline' };
            return lastScan;
        }

        let from = state.lastHeight + 1;
        let to = latest;
        if (to < from) {
            console.log('[Result] no new blocks');
            lastScan = { at: Date.now(), scanned: `${from}-${to}`, found: 0, pushed: 0, error: null };
            return lastScan;
        }
        if (to - from + 1 > MAX_BLOCKS_PER_RUN) {
            console.error(`[Warning] ${to - from + 1} blocks behind, exceeds per-run cap ${MAX_BLOCKS_PER_RUN}, skipping the middle section from ${to - MAX_BLOCKS_PER_RUN + 1}`);
            from = to - MAX_BLOCKS_PER_RUN + 1;
        }

        const { found, failedHeights } = await scanRange(from, to);
        const seen = new Set(state.seen || []);
        const fresh = found.filter(t => !seen.has(t.hash));

        let pushed = 0;
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
                console.log(`[Not pushed - missing SendKey] height${tx.height} ${tx.hash} ${tx.amount}`);
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
                pushed++;
            } catch (e) {
                console.error(`[Push failed] ${tx.hash}: ${e.message}`);
            }
            seen.add(tx.hash);
        }

        state.seen = Array.from(seen).slice(-500);
        if (failedHeights.length) {
            const retryFrom = Math.min(...failedHeights) - 1;
            state.lastHeight = Math.max(retryFrom, state.lastHeight);
            console.error(`[Note] ${failedHeights.length} blocks failed to fetch, will rescan from height ${state.lastHeight + 1} next round`);
        } else {
            state.lastHeight = to;
        }
        saveState(state);
        console.log(fresh.length
            ? `[Result] scanned ${from}-${to}, found ${fresh.length} new token launches, pushed ${pushed}`
            : `[Result] scanned ${from}-${to}, no new token launches`);
        result.scanned = `${from}-${to}`;
        result.found = fresh.length;
        result.pushed = pushed;
    } catch (e) {
        console.error('[Scan error]', e.message);
        result.error = e.message;
    }
    lastScan = { at: Date.now(), ...result };
    return lastScan;
}

// ---------------- HTTP service ----------------
const PORT = process.env.PORT || 3000;

function sendJson(res, code, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(body);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    const url = req.url.split('?')[0];
    try {
        if (req.method === 'GET' && url === '/health') {
            return sendJson(res, 200, { ok: true });
        }
        if (req.method === 'GET' && url === '/') {
            const state = loadState();
            const hasKey = !!(state.sendKey || process.env.PUMP_WATCH_SENDKEY);
            return sendJson(res, 200, {
                service: 'Paxi Pump token-launch monitor',
                status: 'running',
                uptimeSec: Math.floor(process.uptime()),
                sendKeySet: hasKey,
                lastScan,
                nextScanInSec: Math.max(0, SCAN_INTERVAL_MS - (Date.now() - lastScan.at)) / 1000
            });
        }
        if (req.method === 'POST' && url === '/config') {
            const body = await readBody(req);
            let parsed;
            try { parsed = JSON.parse(body); } catch (_) { return sendJson(res, 400, { error: 'invalid json' }); }
            const key = String(parsed.sendKey || '').trim();
            if (!/^SCT/.test(key)) return sendJson(res, 400, { error: 'sendKey must start with SCT' });
            const state = loadState();
            state.sendKey = key;
            saveState(state);
            return sendJson(res, 200, { ok: true, sendKeySet: true });
        }
        if (req.method === 'POST' && url === '/scan') {
            const r = await runScan();
            return sendJson(res, 200, r);
        }
        return sendJson(res, 404, { error: 'not found' });
    } catch (e) {
        return sendJson(res, 500, { error: e.message });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[PumpWatch] listening on 0.0.0.0:${PORT}, auto-scanning every ${SCAN_INTERVAL_MS / 60000} minutes`);
    runScan().catch(e => console.error('[First scan error]', e.message));
    setInterval(() => runScan().catch(e => console.error('[Scheduled scan error]', e.message)), SCAN_INTERVAL_MS);
});
