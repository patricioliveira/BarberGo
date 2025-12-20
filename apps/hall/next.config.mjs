import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "static.vecteezy.com",
      },
      {
        protocol: "http",
        hostname: "googleusercontent.com",
      },
      {
        hostname: "utfs.io",
      },
    ],
  },
  transpilePackages: ["@barbergo/shared", "@barbergo/ui", "@barbergo/database"],
};

// Configura o PWA envolvendo a configuração original
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Desativa em dev para evitar problemas de cache
})(nextConfig);

export default pwaConfig;