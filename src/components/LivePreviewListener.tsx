'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { getClientSideURL } from '@/lib/getURL'

/** Оновлює серверний рендер сторінки, коли в адмінці зберігається (автозбереження) чернетка. */
export const LivePreviewListener = () => {
  const router = useRouter()
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={getClientSideURL()} />
}
