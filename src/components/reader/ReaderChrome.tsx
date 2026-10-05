'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'
import UserNav from '@/components/user-nav'

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

const pluralComments = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'коментар'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'коментарі'
  return 'коментарів'
}

const endTile =
  'flex min-h-[96px] flex-col justify-center gap-1 rounded-tile-sm bg-tile px-5 py-4 transition-colors hover:bg-chip'

/** Плитки в кінці розділу: попередній / наступний / обговорення */
export function ReaderEndTiles({
  bookSlug,
  page,
  hasNextChapter,
  chapterID,
}: {
  bookSlug: string
  page: number
  hasNextChapter: boolean
  chapterID: string
}) {
  const { data } = useSWR<{ totalDocs?: number }>(
    `/api/chapterComments?where[chapter][equals]=${chapterID}&limit=1&depth=0`,
    (url: string) => fetch(url).then((res) => res.json()),
  )
  const count = data?.totalDocs

  return (
    <section className="mt-10 grid grid-cols-2 gap-3.5 md:grid-cols-3">
      {page > 1 ? (
        <Link href={`/novel/${bookSlug}/${page - 1}`} className={endTile}>
          <span className="text-[13px] font-semibold text-muted-foreground">← Попередній</span>
          <span className="font-bold">Розділ {page - 1}</span>
        </Link>
      ) : (
        <Link href={`/novel/${bookSlug}`} className={endTile}>
          <span className="text-[13px] font-semibold text-muted-foreground">← Назад</span>
          <span className="font-bold">До книги</span>
        </Link>
      )}
      {hasNextChapter ? (
        <Link
          href={`/novel/${bookSlug}/${page + 1}`}
          className={`${endTile} bg-primary text-primary-foreground hover:bg-primary/90`}
        >
          <span className="text-[13px] font-semibold opacity-80">Наступний →</span>
          <span className="font-bold">Розділ {page + 1}</span>
        </Link>
      ) : (
        <Link href={`/novel/${bookSlug}`} className={endTile}>
          <span className="text-[13px] font-semibold text-muted-foreground">Це останній розділ</span>
          <span className="font-bold">До книги →</span>
        </Link>
      )}
      <a href="#comments" className={`${endTile} col-span-2 md:col-span-1`}>
        <span className="text-[13px] font-semibold text-muted-foreground">Обговорення</span>
        <span className="font-bold">
          {count === undefined ? 'Коментарі' : count === 0 ? 'Поки без коментарів' : `${count} ${pluralComments(count)}`}
        </span>
      </a>
    </section>
  )
}
