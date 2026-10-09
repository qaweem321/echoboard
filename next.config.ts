import type { NextConfig } from "next";

// Sent with every response. Each one turns on a browser protection.
const securityHeaders = [
  // Only load this site over HTTPS for the next 2 years.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Don't guess file types; use the type the server sends.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the domain (not the full URL) when linking to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This app never needs the camera, microphone or location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const policy = "base-uri 'self'; object-src 'none'";

// Every page except the widget panel: other sites may not show it in an <iframe>
// (stops clickjacking).
const noFraming = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: `frame-ancestors 'none'; ${policy}` },
];

// The widget panel (/embed/...) is made to be shown inside customers' websites.
const allowFraming = [{ key: "Content-Security-Policy", value: `frame-ancestors *; ${policy}` }];

const nextConfig: NextConfig = {
  // The "N" badge only shows during `npm run dev`. Keep it out of the sidebar.
  devIndicators: { position: "bottom-right" },
  // Don't advertise "X-Powered-By: Next.js" to attackers.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/:path((?!embed/).*)", headers: noFraming },
      { source: "/embed/:path*", headers: allowFraming },
    ];
  },
};

export default nextConfig;
