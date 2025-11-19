/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['vckynnyputrvwjhosryl.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
