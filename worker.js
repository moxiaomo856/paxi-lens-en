/**
 * Paxi Lens - geographic restriction layer
 * 合规要求：不面向中国大陆居民提供服务。
 * Cloudflare 边缘对每个请求自带访问者国家信息（request.cf.country），
 * 中国大陆 IP（CN）直接返回 403，其余请求原样转发到静态资源。
 */
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
    return env.ASSETS.fetch(request);
  }
};
