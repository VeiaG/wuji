import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build, payload types mismatch
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
