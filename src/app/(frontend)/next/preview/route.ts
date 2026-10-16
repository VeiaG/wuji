import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkRole } from '@/collections/access/checkRole'
import { isSafePreviewPath } from '@/lib/preview'

/**
 * Вмикає Next.js draft mode і перенаправляє на сторінку документа.
 * Лише для адмінів — авторизація через cookie сесії Payload.
 */
export async function GET(request: Request): Promise<Response> {
  const path = new URL(request.url).searchParams.get('path')
  if (!isSafePreviewPath(path)) {
    return new Response('Некоректний шлях', { status: 400 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!checkRole(['admin'], user)) {
    const draft = await draftMode()
    draft.disable()
    return new Response('Недостатньо прав для перегляду чернеток', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}
