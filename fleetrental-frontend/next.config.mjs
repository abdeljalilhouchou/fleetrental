/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Proxy API + Storage calls through Vercel so the browser never makes
   * cross-origin requests to Railway → zero CORS issues.
   *
   * Requires the server-side env var BACKEND_ORIGIN to be set on Vercel
   * (e.g. https://fleetrental-production.up.railway.app).
   * NEXT_PUBLIC_API_URL must be set to /api on Vercel.
   *
   * Local dev: BACKEND_ORIGIN is not set → no rewrites → api.js falls back
   * to http://localhost:8000/api as usual.
   */
  async rewrites() {
    const origin = process.env.BACKEND_ORIGIN;
    if (!origin) return [];
    return [
      { source: '/api/:path*',     destination: `${origin}/api/:path*` },
      { source: '/storage/:path*', destination: `${origin}/storage/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      { hostname: 'localhost', port: '8000', protocol: 'http' },
      { hostname: '**.railway.app', protocol: 'https' },
    ],
  },
};

export default nextConfig;
