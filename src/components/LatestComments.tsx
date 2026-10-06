'use client'

import React from 'react'
import Link from 'next/link'
import removeMd from 'remove-markdown'
import { getUserAvatarURL } from '@/lib/avatars'
import { formatTimeAgo } from '@/lib/formatTime'
import { useLatestComments } from '@/components/home/useLatestComments'
import { Skeleton } from '@/components/ui/skeleton'

export const LatestComments = ({ limit = 6 }: { limit?: number }) => {
  const { comments, isLoading } = useLatestComments()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (comments.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Поки що немає коментарів</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {comments.slice(0, limit).map((comment) => {
        const { user, chapter } = comment
        const book = chapter.book

        return (
          <div key={comment.id} className="flex gap-3 rounded-2xl bg-chip p-3.5">
            <Link href={`/profile/${user.slug}`} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getUserAvatarURL(user)}
                alt={user.nickname}
                className="size-9 rounded-xl bg-tile object-cover"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-baseline gap-2 text-[13px]">
                <Link href={`/profile/${user.slug}`} className="truncate font-semibold hover:text-primary">
                  {user.nickname}
                </Link>
                <span className="shrink-0 text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
              </span>
              <p className="line-clamp-2 whitespace-break-spaces text-sm leading-snug text-soft">
                {removeMd(comment.content)}
              </p>
              <Link
                href={`/redirect/novel/${chapter.id}?disableSaving=true`}
                className="truncate text-[13px] text-muted-foreground transition-colors hover:text-primary"
              >
                {book.title} · {chapter.title}
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
