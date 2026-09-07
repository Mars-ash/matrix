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
};

export default nextConfig;
