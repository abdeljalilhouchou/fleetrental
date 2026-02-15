/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'localhost', port: '8000', protocol: 'http' },
      { hostname: '**.railway.app', protocol: 'https' },
    ],
  },
};

export default nextConfig;
