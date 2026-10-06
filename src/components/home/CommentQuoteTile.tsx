'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import removeMd from 'remove-markdown'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLatestComments } from './useLatestComments'
import { cn } from '@/lib/utils'

const ROTATE_MS = 7000
const MAX_QUOTES = 4

// Цитата свіжого коментаря у hero-ряді головної; кілька останніх по черзі змінюють одна одну
export function CommentQuoteTile({ className }: { className?: string }) {
  const { comments, isLoading } = useLatestComments()
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const quotes = comments.slice(0, MAX_QUOTES)

  useEffect(() => {
    if (quotes.length < 2 || paused || reduceMotion) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % quotes.length), ROTATE_MS)
    return () => clearInterval(timer)
  }, [quotes.length, paused, reduceMotion])

  const base = 'flex flex-col gap-2 rounded-tile bg-tile px-5 py-5 md:px-6 md:py-[22px]'

  if (isLoading)
    return <div className={cn(base, 'min-h-[120px] animate-pulse', className)} aria-hidden />
  const comment = quotes[index % Math.max(quotes.length, 1)]
  if (!comment) return null

  return (
    <Link
      href={`/redirect/novel/${comment.chapter.id}?disableSaving=true`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className={cn(base, 'overflow-hidden transition-colors hover:bg-chip', className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={comment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex min-w-0 flex-col gap-2"
        >
          <span className="truncate text-[13px] font-semibold text-muted-foreground">
            {comment.user.nickname} · {comment.chapter.book.title}
          </span>
          <span className="line-clamp-4 text-[15px] leading-[1.45] text-soft">
            «{removeMd(comment.content).trim()}»
          </span>
        </motion.span>
      </AnimatePresence>

      {quotes.length > 1 && (
        <span className="mt-auto flex gap-1.5 pt-1" aria-hidden>
          {quotes.map((quote, i) => (
            <span
              key={quote.id}
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                i === index ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30',
              )}
            />
          ))}
        </span>
      )}
    </Link>
  )
}
