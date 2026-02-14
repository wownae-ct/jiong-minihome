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
    ],
  },
};

export default nextConfig;
