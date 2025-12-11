/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence workspace root inference warning when multiple lockfiles exist
  turbopack: {
    root: __dirname,
  },
  images: {
    // Use remotePatterns (domains is deprecated in Next 16)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
