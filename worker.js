/**
 * Paxi Lens - geographic restriction layer
 * 合规要求：不面向中国大陆居民提供服务。
 * Cloudflare 边缘对每个请求自带访问者国家信息（request.cf.country），
 * 中国大陆 IP（CN）直接返回 403，其余请求原样转发到静态资源。
 */
// 静态资源缓存策略：HTML/JS/CSS/JSON 一律 no-cache（每次回源，靠 ETag/304 走，代价极小）。
// 原因：浏览器若缓存了旧版 shared.js，却加载到新版工具文件，两者的全局函数不一致，
// 运行时直接抛 ReferenceError，会让整个 NFT 列表变空白。禁止缓存即可根除这类错配。
const ALWAYS_REVALIDATE = ["html", "js", "css", "json", "webmanifest", "map"];

function _withRevalidateHeaders(res, request) {
  let pathname = "/";
  try { pathname = new URL(request.url).pathname; } catch (_) {}
  const m = pathname.match(/\.([a-z0-9]+)$/i);
  const ext = m ? m[1].toLowerCase() : "";
  if (ext !== "" && !ALWAYS_REVALIDATE.includes(ext)) return res;
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", "no-cache, must-revalidate");
  if (res.status === 304) return new Response(null, { status: 304, statusText: res.statusText, headers });
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request, env) {
    const country = request.cf && request.cf.country;
    if (country === "CN") {
      return new Response(
        "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Service Unavailable</title></head>" +
        "<body style='font-family:sans-serif;background:#111;color:#eee;text-align:center;padding:60px 20px;'>" +
        "<h2>403 — Service Not Available in Your Region</h2>" +
        "<p>This service is not offered to mainland China.</p>" +
        "<p>本服务不面向中国大陆地区提供。</p>" +
        "</body></html>",
        { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
    const res = await env.ASSETS.fetch(request);
    return _withRevalidateHeaders(res, request);
  }
};
