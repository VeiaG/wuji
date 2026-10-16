import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { isSafePreviewPath } from '@/lib/preview'

export async function GET(request: Request): Promise<Response> {
  const path = new URL(request.url).searchParams.get('path')
  const draft = await draftMode()
  draft.disable()
  redirect(isSafePreviewPath(path) ? path : '/')
}
