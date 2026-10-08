import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['takumi-js'],
  
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        // Security headers for every route; HSTS matches what Vercel already sends.
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
      // iOS and crawlers ask for /apple-touch-icon.png by name (marketing backlog item 84).
      {
        source: '/apple-touch-icon.png',
        destination: '/apple-icon.png',
      },
    ];
  },
};

export default withMDX(config);
