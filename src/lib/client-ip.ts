// The visitor's IP address, for rate limits. Behind Vercel or another proxy the first address
// in x-forwarded-for is the visitor; x-real-ip is the fallback. "unknown" groups the rest.
export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
