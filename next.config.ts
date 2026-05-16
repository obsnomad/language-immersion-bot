import type { NextConfig } from 'next';

const miniAppUrl = process.env.MINIAPP_URL;
const miniAppHost = miniAppUrl ? new URL(miniAppUrl).hostname : undefined;

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: { position: 'top-right' },
  allowedDevOrigins: [...(miniAppHost ? [miniAppHost] : []), '*.ngrok-free.dev'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
    ];
  },
};

export default config;
