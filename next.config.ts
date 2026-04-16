import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/audio/:file*.m4a",
        headers: [
          { key: "Content-Type", value: "audio/mp4" },
          { key: "Accept-Ranges", value: "bytes" },
        ],
      },
    ];
  },
};

export default nextConfig;
