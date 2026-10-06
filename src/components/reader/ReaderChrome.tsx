'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'
import UserNav from '@/components/user-nav'
import { cn } from '@/lib/utils'

// Хедер читалки (режим стрічки): лого, назад до книги, номер розділу, профіль
export function ReaderHeader({
  bookSlug,
  bookTitle,
  page,
  totalChapters,
}: {
  bookSlug: string
  bookTitle: string
  page: number
  totalChapters: number
}) {
  return (
    <header className="container-page flex items-center gap-3 py-4 md:gap-6 md:py-[18px]">
      <Logo className="hidden md:block" />
      <Link
        href={`/novel/${bookSlug}`}
        className="flex min-w-0 items-center gap-2.5 text-[15px] font-semibold text-soft transition-colors hover:text-foreground"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-tile md:size-auto md:bg-transparent">
          <ArrowLeft className="size-5 md:size-4" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{bookTitle}</span>
          <span className="text-[13px] font-medium text-muted-foreground md:hidden">Розділ {page}</span>
        </span>
      </Link>
      <span className="flex-1" />
      <span className="hidden shrink-0 text-sm text-muted-foreground tabular-nums md:block">
        Розділ {page} з {totalChapters}
      </span>
      <div className="hidden items-center gap-2 md:flex">
        <UserNav />
      </div>
    </header>
  )
}

/** Тонкий прогрес-бар розділу вгорі екрана */
export function ReaderProgressBar({ value }: { value: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px] bg-transparent" aria-hidden>
      <div
        className="h-full bg-primary transition-[width] duration-150"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  )
}

const endTile = 'flex min-h-[96px] flex-col justify-center gap-1 rounded-tile-sm px-5 py-4 transition-colors'

/** Плитки в кінці розділу: попередній / наступний (коментарі одразу під ними) */
export function ReaderEndTiles({
  bookSlug,
  page,
  hasNextChapter,
}: {
  bookSlug: string
  page: number
  hasNextChapter: boolean
}) {
  return (
    <section className="mt-10 grid grid-cols-2 gap-3.5">
      {page > 1 ? (
        <Link href={`/novel/${bookSlug}/${page - 1}`} className={cn(endTile, 'bg-tile hover:bg-chip')}>
          <span className="text-[13px] font-semibold text-muted-foreground">← Попередній</span>
          <span className="font-bold">Розділ {page - 1}</span>
        </Link>
      ) : (
        <Link href={`/novel/${bookSlug}`} className={cn(endTile, 'bg-tile hover:bg-chip')}>
          <span className="text-[13px] font-semibold text-muted-foreground">← Назад</span>
          <span className="font-bold">До книги</span>
        </Link>
      )}
      {hasNextChapter ? (
        <Link
          href={`/novel/${bookSlug}/${page + 1}`}
          className={cn(endTile, 'items-end bg-primary text-right text-primary-foreground hover:bg-primary/90')}
        >
          <span className="text-[13px] font-semibold opacity-80">Наступний →</span>
          <span className="font-bold">Розділ {page + 1}</span>
        </Link>
      ) : (
        <Link
          href={`/novel/${bookSlug}`}
          className={cn(endTile, 'items-end bg-tile text-right hover:bg-chip')}
        >
          <span className="text-[13px] font-semibold text-muted-foreground">Це останній розділ</span>
          <span className="font-bold">До книги →</span>
        </Link>
      )}
    </section>
  )
}
