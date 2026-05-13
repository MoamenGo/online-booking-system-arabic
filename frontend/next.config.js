/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel handles optimization automatically — no need for 'standalone'
  images: {
    domains: [],
  },
  // Ensure API calls work in both server and client components
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
