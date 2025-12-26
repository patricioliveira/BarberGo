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

export default nextConfig;