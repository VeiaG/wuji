'use client'

import { useAuth } from '@/providers/auth'
import { Fragment } from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { ShieldUser } from 'lucide-react'
import { getUserAvatarURL } from '@/lib/avatars'
import { cn } from '@/lib/utils'

const UserNav = () => {
  const { user } = useAuth()
  // Поки авторизація не завантажилась — нічого не показуємо, щоб не блимало
  if (user === undefined) return null

  if (user) {
    const hasCustomAvatar = typeof user.avatar === 'object' && !!user.avatar?.url
    return (
      <Fragment>
        {(user.roles.includes('admin') || user.roles.includes('editor')) && (
          <Link
            href="/admin"
            aria-label="Адмін-панель"
            className="grid size-11 place-items-center rounded-[14px] bg-tile transition-colors hover:bg-chip"
          >
            <ShieldUser className="size-[18px]" />
          </Link>
        )}
        <Link
          href="/profile"
          aria-label={`Профіль ${user.nickname}`}
          className={cn(
            'grid size-11 shrink-0 place-items-center overflow-hidden rounded-[14px] font-display text-sm font-extrabold transition-opacity hover:opacity-90',
            hasCustomAvatar ? 'bg-tile' : 'bg-primary text-primary-foreground',
          )}
        >
          {hasCustomAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getUserAvatarURL(user)} alt="" className="size-full object-cover" />
          ) : (
            user.nickname?.charAt(0).toUpperCase()
          )}
        </Link>
      </Fragment>
    )
  }
  return (
    <Fragment>
      <Button variant="secondary" asChild className="h-11 rounded-[14px] px-4">
        <Link href="/login">Увійти</Link>
      </Button>
      <Button asChild className="h-11 rounded-[14px] px-4">
        <Link href="/register">Реєстрація</Link>
      </Button>
    </Fragment>
  )
}

export default UserNav
