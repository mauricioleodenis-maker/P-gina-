import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@react-pdf/renderer'],
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
};

export default createMDX({})(nextConfig);
