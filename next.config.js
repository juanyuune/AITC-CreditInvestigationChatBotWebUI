/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://192.168.20.169:3000", "http://192.168.20.169"],
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Allow long-running API routes (10 minutes)
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Connection", value: "keep-alive" }],
      },
    ];
  },
};

module.exports = nextConfig;
