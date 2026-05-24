import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // heic-convert(libheif WASM)는 번들 대신 node_modules에서 직접 로드하도록 외부 처리
  serverExternalPackages: ['heic-convert'],
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
    ],
  },
};

export default nextConfig;
