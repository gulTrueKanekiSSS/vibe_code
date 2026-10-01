import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  // Next.js must allow the configured public tunnel to load dev-only assets.
  allowedDevOrigins: process.env.NEXT_PUBLIC_APP_URL
    ? [new URL(process.env.NEXT_PUBLIC_APP_URL).hostname]
    : [],
  logging: {
    // OAuth callbacks carry one-time authorization codes and state in the URL.
    incomingRequests: { ignore: [/^\/api\/auth\/telegram(?:\/|\?|$)/] },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
