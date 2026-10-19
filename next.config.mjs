const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverActions: { bodySizeLimit: '4mb' } } };
export default nextConfig;
