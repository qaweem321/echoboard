import type { NextConfig } from "next";

// Sent with every response. Each one turns on a browser protection.
const securityHeaders = [
  // Only load this site over HTTPS for the next 2 years.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Don't let other sites show this app in an <iframe> (stops clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  },
  // Don't guess file types; use the type the server sends.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the domain (not the full URL) when linking to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This app never needs the camera, microphone or location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The "N" badge only shows during `npm run dev`. Keep it out of the sidebar.
  devIndicators: { position: "bottom-right" },
  // Don't advertise "X-Powered-By: Next.js" to attackers.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
