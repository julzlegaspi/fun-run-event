import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sample event photography is served from Unsplash's CDN. The query is
    // pinned so the optimizer fetches a pre-sized source instead of the
    // multi-megabyte original (which times out), and can't be abused to
    // request arbitrary transforms. Keep in sync with `unsplash()` in
    // src/lib/events.ts.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-*",
        search: "?w=1920&q=80&fm=jpg&fit=crop",
      },
    ],
  },
};

export default nextConfig;
