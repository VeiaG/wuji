import React from 'react'
import type { ServerProps } from 'payload'
import type { User } from '@/payload-types'
import { getUserAvatarURL } from '@/lib/avatars'
import './branding.css'

/**
 * Аватар акаунта в адмінці (`admin.avatar`): завантажений аватар користувача або
 * dicebear за нікнеймом — так само, як на сайті (`getUserAvatarURL`).
 * Серверний компонент: `user` тут без populate, тож аватар-ід дочитуємо самі.
 */
export async function AdminAvatar({ payload, user }: Pick<ServerProps, 'payload' | 'user'>) {
  const account = user as unknown as User | undefined
  let src = getUserAvatarURL(account)

  if (account?.avatar && typeof account.avatar !== 'object') {
    const upload = await payload
      .findByID({
        collection: 'user-uploads',
        id: account.avatar,
        depth: 0,
        select: { url: true },
        overrideAccess: true,
      })
      .catch(() => null)
    if (upload?.url) src = upload.url
  }

  // eslint-disable-next-line @next/next/no-img-element -- аватар 24px, next/image в адмінці не потрібен
  return <img alt="" className="admin-avatar" height={24} src={src} width={24} />
}
