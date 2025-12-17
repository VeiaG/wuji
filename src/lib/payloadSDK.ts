'use client'
import { PayloadSDK } from '@payloadcms/sdk'
import type { Config } from '@/payload-types'

/**
 * Payload SDK instance for making API requests
 * @experimental marked as experimental while the SDK is in beta
 */
export const sdk = new PayloadSDK<Config>({
  baseURL:'/api',
  baseInit: { credentials: 'include' },
  fetch: typeof window !== 'undefined' ? window.fetch.bind(window) : globalThis.fetch,
})
