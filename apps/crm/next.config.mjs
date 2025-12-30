import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    transpilePackages: ["@barbergo/shared", "@barbergo/ui", "@barbergo/database"],
    images: {
        remotePatterns: [
            { hostname: "lh3.googleusercontent.com" },
            { hostname: "utfs.io" }
        ],
    },
};

const pwaConfig = withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    importScripts: ['/sw-custom.js'],
})(nextConfig);

export default pwaConfig;