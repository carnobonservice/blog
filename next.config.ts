import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2jfx0w9sp915a.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
