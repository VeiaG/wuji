'use client'

import Link from 'next/link'
import removeMd from 'remove-markdown'
import { useLatestComments } from './useLatestComments'
import { cn } from '@/lib/utils'

// Цитата найсвіжішого коментаря у hero-ряді головної
export function CommentQuoteTile({ className }: { className?: string }) {
  const { comments, isLoading } = useLatestComments()
  const comment = comments[0]

  const base = 'flex flex-col gap-2 rounded-tile bg-tile px-5 py-5 md:px-6 md:py-[22px]'

  if (isLoading) return <div className={cn(base, 'min-h-[120px] animate-pulse', className)} aria-hidden />
  if (!comment) return null

  return (
    <Link
      href={`/redirect/novel/${comment.chapter.id}?disableSaving=true`}
      className={cn(base, 'transition-colors hover:bg-chip', className)}
    >
      <span className="truncate text-[13px] font-semibold text-muted-foreground">
        {comment.user.nickname} · {comment.chapter.book.title}
      </span>
      <p className="line-clamp-4 text-[15px] leading-[1.45] text-soft">
        «{removeMd(comment.content).trim()}»
      </p>
    </Link>
  )
}
