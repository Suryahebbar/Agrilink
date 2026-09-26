import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/dashboard/seller',
        destination: '/dashboard/supplier',
      },
      {
        source: '/dashboard/seller/:path*',
        destination: '/dashboard/supplier/:path*',
      },
      {
        source: '/register/seller',
        destination: '/register/supplier',
      },
    ];
  },
};

export default nextConfig;
