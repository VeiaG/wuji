'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, List, MessageCircle, PencilLine } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ChapterListSheet from '@/components/ChapterListSheet'
import { ReaderSettings } from './ReaderSettings'
import type { Settings } from '@/globals/settings'
import { useAuth } from '@/providers/auth'
import { cn } from '@/lib/utils'

export const panelButton =
  'grid size-11 shrink-0 place-items-center rounded-[14px] text-foreground transition-colors hover:bg-chip cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-35'

// Плаваюча панель читання (режим стрічки): зміст, ‹, прогрес, коментарі, ›, Aa
export function ReaderPanel({
  settings,
  onSettingsChange,
  page,
  totalChapters,
  chapterProgress,
  bookSlug,
  chapterID,
  hasNextChapter,
  isHidden,
  setIsHidden,
}: {
  settings: Settings
  onSettingsChange: (partial: Partial<Settings>) => void
  page: number
  totalChapters: number
  chapterProgress: number
  bookSlug: string
  chapterID: string
  hasNextChapter: boolean
  isHidden: boolean
  setIsHidden: (hidden: boolean) => void
}) {
  const { user } = useAuth()
  const canEdit = !!user && (user.roles.includes('admin') || user.roles.includes('editor'))
  const lastScrollY = useRef(0)

  // Ховаємо панель при прокрутці вниз, показуємо при прокрутці вгору
  useEffect(() => {
    const threshold = 64
    let ticking = false
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const delta = currentScrollY - lastScrollY.current
        if (Math.abs(delta) >= threshold) {
          setIsHidden(delta > 0)
          lastScrollY.current = currentScrollY
        }
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [setIsHidden])

  const percent = Math.round(chapterProgress * 100)

  return (
    <nav
      aria-label="Панель читання"
      className={cn(
        'fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-[560px] transition-transform duration-300',
        isHidden && 'translate-y-[calc(100%+24px)]',
      )}
    >
      <div className="flex items-center gap-1 rounded-[24px] bg-tile p-1.5 shadow-float">
        <ChapterListSheet bookSlug={bookSlug} page={page}>
          <button type="button" className={panelButton} aria-label="Зміст">
            <List className="size-5" />
          </button>
        </ChapterListSheet>

        <Link
          href={`/novel/${bookSlug}/${page - 1}`}
          aria-label="Попередній розділ"
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={panelButton}
        >
          <ChevronLeft className="size-5" />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 px-1">
          <span className="truncate text-xs font-semibold tabular-nums text-soft">
            <span className="hidden sm:inline">
              {page} / {totalChapters} ·{' '}
            </span>
            {percent}% розділу
          </span>
          <span className="block h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-chip">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </span>
        </div>

        <a href="#comments" aria-label="Коментарі" className={panelButton}>
          <MessageCircle className="size-5" />
        </a>

        <Link
          href={`/novel/${bookSlug}/${page + 1}`}
          aria-label="Наступний розділ"
          aria-disabled={!hasNextChapter}
          tabIndex={!hasNextChapter ? -1 : undefined}
          className={panelButton}
        >
          <ChevronRight className="size-5" />
        </Link>

        {canEdit && (
          <Link
            href={`/admin/collections/bookChapters/${chapterID}`}
            target="_blank"
            aria-label="Редагувати розділ"
            className={cn(panelButton, 'hidden sm:grid')}
          >
            <PencilLine className="size-[18px]" />
          </Link>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Налаштування читання"
              className={cn(panelButton, 'bg-chip font-display text-sm font-extrabold')}
            >
              Aa
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" sideOffset={14} className="w-auto rounded-tile-sm p-4">
            <ReaderSettings settings={settings} onChange={onSettingsChange} />
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  )
}
