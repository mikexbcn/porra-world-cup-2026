/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true, // Esto ayuda a que Tailwind v4 cargue más rápido
  },
};

export default nextConfig;