import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: (process.env.MINIO_PUBLIC_URL?.startsWith("https") ? "https" : "http") as "http" | "https",
        hostname: process.env.MINIO_IMAGE_HOSTNAME || "localhost",
      },
      // 레거시 path-based URL 하위호환 (DB 마이그레이션 완료 후 제거)
      {
        protocol: "http",
        hostname: "jiun2.ddns.net",
      },
    ],
  },
};

export default nextConfig;
