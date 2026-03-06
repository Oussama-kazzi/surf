/** @type {import('next').NextConfig} */
const nextConfig = {
  // We'll proxy API calls to our backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
