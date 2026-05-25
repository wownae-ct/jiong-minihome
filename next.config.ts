import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // heic-convert(libheif WASM)는 번들 대신 node_modules에서 직접 로드하도록 외부 처리
  serverExternalPackages: ['heic-convert'],
  images: {
    // 자체호스팅(CDN 없음) + 비공개 MinIO 프록시(/api/files) 환경에서는
    // Next 이미지 최적화기가 파드 내부에서 이미지를 재-fetch하다 실패(400)한다.
    // 최적화기를 끄고 브라우저가 원본을 직접 로드하게 한다.
    unoptimized: true,
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
