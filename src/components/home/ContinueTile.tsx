'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { stringify } from 'qs-esm'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/providers/auth'
import type { Book, ReadProgress } from '@/payload-types'
import { cn } from '@/lib/utils'

type ProgressWithBook = ReadProgress & { book: Book }

const tileClass =
  'flex min-h-[200px] flex-col gap-3 rounded-tile bg-primary p-5 text-primary-foreground transition-opacity hover:opacity-95 md:p-[26px]'

// Акцентна плитка «Продовжити»: остання книга з прогресом, або заклик зареєструватись для гостей
export function ContinueTile({ className }: { className?: string }) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<ProgressWithBook | null | undefined>(undefined)

  useEffect(() => {
    if (user === undefined) return
    if (user === null) {
      setProgress(null)
      return
    }
    const qs = stringify({
      where: { user: { equals: user.id } },
      sort: '-updatedAt',
      limit: 1,
      depth: 2,
    })
    fetch(`/api/readProgress?${qs}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const doc = data?.docs?.[0]
        setProgress(doc && typeof doc.book === 'object' && doc.book ? doc : null)
      })
      .catch(() => setProgress(null))
  }, [user])

  if (user === undefined || progress === undefined) {
    return <div className={cn(tileClass, 'animate-pulse opacity-70', className)} aria-hidden />
  }

  if (user === null) {
    return (
      <div className={cn(tileClass, className)}>
        <span className="text-sm font-bold">Продовжити</span>
        <span className="font-display text-[22px] font-extrabold leading-[1.1] tracking-[-0.02em] md:text-[26px]">
          Зберігайте прогрес читання
        </span>
        <span className="text-sm leading-snug opacity-80">
          Зареєструйтесь — і продовжуйте з того ж розділу на будь-якому пристрої.
        </span>
        <span className="flex-1" />
        <span className="flex flex-wrap items-center gap-2">
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-primary-foreground px-4 text-sm font-bold text-primary"
          >
            Зареєструватись <ArrowRight className="size-4" />
          </Link>
          <Link href="/login" className="inline-flex min-h-11 items-center px-3 text-sm font-bold">
            Увійти
          </Link>
        </span>
      </div>
    )
  }

  if (!progress) {
    return (
      <Link href="/novels" className={cn(tileClass, className)}>
        <span className="text-sm font-bold">Почніть читати</span>
        <span className="font-display text-[22px] font-extrabold leading-[1.1] tracking-[-0.02em] md:text-[26px]">
          Оберіть першу книгу в каталозі
        </span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          До каталогу <ArrowRight className="size-4" />
        </span>
      </Link>
    )
  }

  const book = progress.book
  const total = book.chapterCount || progress.chapter || 1
  const percent = Math.min(100, Math.round((progress.chapter / total) * 100))
  const cover = typeof book.coverImage === 'object' ? book.coverImage : null

  return (
    <Link href={`/novel/${book.slug}/${progress.chapter}`} className={cn(tileClass, className)}>
      <span className="flex items-start justify-between gap-3">
        <span className="text-sm font-bold">Продовжити</span>
        <span className="font-display text-[44px] font-extrabold leading-[0.9] tracking-[-0.04em] md:text-[54px]">
          {percent}%
        </span>
      </span>
      <span className="flex-1" />
      <span className="flex items-center gap-3.5">
        {cover?.url && (
          <Image
            src={cover.url}
            alt=""
            width={48}
            height={72}
            className="h-[72px] w-12 shrink-0 rounded-lg object-cover"
          />
        )}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2 text-[17px] font-bold leading-tight">{book.title}</span>
          <span className="text-sm opacity-80">
            Розділ {progress.chapter} з {total}
          </span>
        </span>
      </span>
    </Link>
  )
}
