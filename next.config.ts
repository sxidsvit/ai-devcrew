import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Workspace logos (max 1 MB) are uploaded through a server action.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
