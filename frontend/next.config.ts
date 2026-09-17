import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD || process.env.OUTPUT_STANDALONE
    ? { output: "standalone" }
    : {}),
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "nature-stated-customs-conducted.trycloudflare.com",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${backendUrl}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
