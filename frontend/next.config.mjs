/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para produção
  swcMinify: true,
  
  // Configurações para melhor compatibilidade com dispositivos móveis
  experimental: {
    // Reduz o tamanho dos bundles
    optimizePackageImports: ['react-toastify'],
  },
  
  // Configurações de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Transpilação para melhor compatibilidade
  transpilePackages: ['react-toastify'],
};

export default nextConfig;
