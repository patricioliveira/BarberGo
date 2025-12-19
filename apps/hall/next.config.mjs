/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Domínio oficial das fotos do Google
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
}

export default nextConfig