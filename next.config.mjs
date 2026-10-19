// 4 Mo : limite des fonctions Vercel. Les photos sont ensuite réduites à ~50 Ko côté serveur.
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '4mb' } } };
export default nextConfig;
