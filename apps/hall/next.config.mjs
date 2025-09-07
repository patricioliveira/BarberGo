/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
      },
    ],
  },
  transpilePackages: ["@barbergo/shared", "@barbergo/ui", "@barbergo/database"],
}

export default nextConfig