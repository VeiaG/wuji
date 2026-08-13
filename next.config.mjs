import { withPayload } from '@payloadcms/next/withPayload'

// Хост публічного R2-домену для next/image. Береться з R2_PUBLIC_URL,
// із фолбеком на прод-домен (env може бути відсутнім під час білду).
const r2Hostname = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL).hostname
  : 'media.wuji.world'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  output: 'standalone',
  images: {
    remotePatterns: [{ protocol: 'https', hostname: r2Hostname }],
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build, payload types mismatch
  },
  // Fix for scss on windows machines
  // Shouldn't affect other runtime environments
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
