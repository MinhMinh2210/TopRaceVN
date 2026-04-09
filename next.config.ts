import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Thêm các config cũ của bạn vào đây (nếu có)
  // Ví dụ:
  // reactStrictMode: true,
  // images: { ... },
};

export default async function config() {
  // Vercel build → dùng Next.js thuần (không OpenNext)
  if (process.env.VERCEL === "1") {
    return nextConfig;
  }

  // Cloudflare → dùng OpenNext
  const { withOpenNext } = await import("@opennextjs/cloudflare") as any;
  return withOpenNext(nextConfig);
}