/** @type {import('next').NextConfig} */
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://127.0.0.1:8000";

const nextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com", "*.vercel.app"],

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
