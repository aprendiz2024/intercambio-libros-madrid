/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para deployment en Netlify
  output: 'standalone',
  images: {
    unoptimized: true
  },
  // Asegurar que los assets se sirvan correctamente
  assetPrefix: '',
  trailingSlash: false,
  // Para que los estilos funcionen correctamente
  experimental: {
    optimizeCss: true
  }
};

export default nextConfig;