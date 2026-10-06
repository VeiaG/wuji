'use client'

import { useEffect, useState, type PointerEvent } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { stringify } from 'qs-esm'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/providers/auth'
import type { Book, ReadProgress } from '@/payload-types'
import { cn } from '@/lib/utils'

type ProgressWithBook = ReadProgress & { book: Book }

const tileClass =
  'group relative isolate flex min-h-[200px] flex-col gap-3 overflow-hidden rounded-tile bg-primary p-5 text-primary-foreground md:p-[26px]'

// М'яке світіння, що йде за курсором (лише пристрої з ховером)
const followGlow = (e: PointerEvent<HTMLElement>) => {
  const rect = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--glow-x', `${e.clientX - rect.left}px`)
  e.currentTarget.style.setProperty('--glow-y', `${e.clientY - rect.top}px`)
}

function Glow() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{
        background:
          'radial-gradient(260px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgb(255 255 255 / 0.28), transparent 70%)',
      }}
    />
  )
}

// Відсоток, що «докручується» від 0 при появі
function CountUp({ value }: { value: number }) {
  const reduceMotion = useReducedMotion()
  const count = useMotionValue(reduceMotion ? value : 0)
  const rounded = useTransform(count, (v) => `${Math.round(v)}%`)

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [count, value])

  return <motion.span>{rounded}</motion.span>
}

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
      <div className={cn(tileClass, className)} onPointerMove={followGlow}>
        <Glow />
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
            className="group/btn inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-primary-foreground px-4 text-sm font-bold text-primary transition-transform active:scale-[0.97]"
          >
            Зареєструватись{' '}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
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
      <Link href="/novels" className={cn(tileClass, className)} onPointerMove={followGlow}>
        <Glow />
        <span className="text-sm font-bold">Почніть читати</span>
        <span className="font-display text-[22px] font-extrabold leading-[1.1] tracking-[-0.02em] md:text-[26px]">
          Оберіть першу книгу в каталозі
        </span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          До каталогу{' '}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>
    )
  }

  const book = progress.book
  const total = book.chapterCount || progress.chapter || 1
  const percent = Math.min(100, Math.round((progress.chapter / total) * 100))
  const cover = typeof book.coverImage === 'object' ? book.coverImage : null

  return (
    <Link
      href={`/novel/${book.slug}/${progress.chapter}`}
      className={cn(tileClass, className)}
      onPointerMove={followGlow}
    >
      <Glow />
      <span className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold">
          Продовжити
          <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
        <span className="font-display text-[44px] font-extrabold leading-[0.9] tracking-[-0.04em] tabular-nums md:text-[54px]">
          <CountUp value={percent} />
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
            className="h-[72px] w-12 shrink-0 rounded-lg object-cover shadow-md transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:scale-105"
          />
        )}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2 text-[17px] font-bold leading-tight">{book.title}</span>
          <span className="text-sm opacity-80">
            Розділ {progress.chapter} з {total}
          </span>
        </span>
      </span>
      <span className="block h-1.5 overflow-hidden rounded-full bg-primary-foreground/15">
        <motion.span
          className="block h-full rounded-full bg-primary-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percent, 2)}%` }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </span>
    </Link>
  )
}
