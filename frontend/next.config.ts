import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") ||
  (process.env.NODE_ENV === "production"
    ? "https://officer-destinations-saw-parent.trycloudflare.com"
    : "http://localhost:8000");

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["*.trycloudflare.com", "*.vercel.app"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
