'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { stringify } from 'qs-esm'
import type { PaginatedDocs, Where } from 'payload'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDownWideNarrow, Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import type { Book, BookGenre } from '@/payload-types'
import { BookCard } from '@/components/BookCard'
import { CoverGrid, Tile } from '@/components/bento'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChipPagination } from './ChipPagination'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const LIMIT = 12

const SORTS = [
  { value: 'new', label: 'Нові', sort: '-createdAt' },
  { value: 'updated', label: 'Нещодавно оновлені', sort: '-updatedAt' },
  { value: 'rating', label: 'За рейтингом', sort: '-averageRating' },
  { value: 'chapters', label: 'Більше розділів', sort: '-chapterCount' },
  { value: 'title', label: 'За назвою', sort: 'title' },
] as const

const STATUSES = [
  { value: 'ongoing', label: 'Онгоінг' },
  { value: 'completed', label: 'Завершено' },
  { value: 'hiatus', label: 'Пауза' },
] as const

const plural = (n: number, [one, few, many]: [string, string, string]) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

const chipClass = (active: boolean) =>
  cn(
    'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-colors cursor-pointer',
    active ? 'bg-primary text-primary-foreground' : 'bg-chip text-soft hover:text-foreground',
  )

type BookCatalogProps = {
  /** Заголовок/вступ над панеллю інструментів */
  header: ReactNode
  /** Обмеження за походженням книги (переклади чи авторські) */
  originWhere: Where
  /** Форми слова для лічильника: книга / книги / книг */
  noun: [string, string, string]
  select?: Record<string, true>
  renderOverlay?: (book: Book) => ReactNode
  /** Кнопка праворуч у панелі (наприклад, відкрити пошук) */
  toolbarEnd?: ReactNode
  errorNoun?: string
}

// Каталог книг: фільтри (статус, жанри з режимом «усі/будь-який») і сортування живуть в URL
export function BookCatalog({
  header,
  originWhere,
  noun,
  select,
  renderOverlay,
  toolbarEnd,
  errorNoun = 'книги',
}: BookCatalogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedGenres = useMemo(
    () => searchParams.get('genre')?.split(',').filter(Boolean) ?? [],
    [searchParams],
  )
  const matchAll = searchParams.get('match') === 'all'
  const status = searchParams.get('status')
  const sortKey = SORTS.find((s) => s.value === searchParams.get('sort'))?.value ?? 'new'

  const [currentPage, setCurrentPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [genreQuery, setGenreQuery] = useState('')

  const updateParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const setGenres = (ids: string[]) =>
    updateParams({
      genre: ids.length ? ids.join(',') : null,
      match: ids.length > 1 && matchAll ? 'all' : null,
    })

  const toggleGenre = (id: string) =>
    setGenres(
      selectedGenres.includes(id)
        ? selectedGenres.filter((g) => g !== id)
        : [...selectedGenres, id],
    )

  const clearAll = () => updateParams({ genre: null, match: null, status: null })

  const filterKey = `${selectedGenres.join(',')}|${matchAll}|${status}|${sortKey}`
  useEffect(() => {
    setCurrentPage(1)
  }, [filterKey])

  const query = useMemo(() => {
    const and: Where[] = [originWhere]
    // «Будь-який» (за замовчуванням) — хоча б один із жанрів; «усі вибрані» — кожен
    if (selectedGenres.length > 0)
      and.push({ genres: { [matchAll ? 'all' : 'in']: selectedGenres } })
    if (status) and.push({ status: { equals: status } })
    return stringify({
      page: currentPage,
      limit: LIMIT,
      where: { and },
      sort: SORTS.find((s) => s.value === sortKey)!.sort,
      ...(select ? { select } : {}),
    })
  }, [originWhere, selectedGenres, matchAll, status, currentPage, sortKey, select])

  const {
    data: books,
    isLoading: booksLoading,
    error: booksError,
  } = useSWR<PaginatedDocs<Book>>(`/api/books?${query}`, fetcher, { keepPreviousData: true })

  // Усі жанри (за замовчуванням API віддає лише 10, а посилання ?genre= можуть вести на будь-який)
  const { data: genresData } = useSWR<PaginatedDocs<BookGenre>>(
    '/api/bookGenres?limit=200&depth=0&sort=title',
    fetcher,
  )
  const countsQuery = stringify({
    pagination: false,
    depth: 0,
    select: { genres: true },
    where: { and: [originWhere, ...(status ? [{ status: { equals: status } }] : [])] },
  })
  const { data: countsData } = useSWR<PaginatedDocs<Pick<Book, 'id' | 'genres'>>>(
    `/api/books?${countsQuery}`,
    fetcher,
  )
  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const book of countsData?.docs ?? []) {
      for (const genre of book.genres ?? []) {
        const id = typeof genre === 'string' ? genre : genre.id
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }
    }
    return counts
  }, [countsData])

  const allGenres = genresData?.docs ?? []
  const genreById = new Map(allGenres.map((g) => [g.id, g]))
  const visibleGenres = genreQuery
    ? allGenres.filter((g) => g.title.toLowerCase().includes(genreQuery.trim().toLowerCase()))
    : allGenres

  const activeCount = selectedGenres.length + (status ? 1 : 0)
  const hasFilters = activeCount > 0
  const sortLabel = SORTS.find((s) => s.value === sortKey)!.label

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <div className="flex flex-col gap-2">
        {header}
        <p className="text-[15px] text-muted-foreground">
          {books ? `Знайдено ${books.totalDocs} ${plural(books.totalDocs, noun)}` : ' '}
        </p>
      </div>

      {/* Панель інструментів */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
          className={cn(
            'inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors cursor-pointer',
            filtersOpen ? 'bg-foreground text-background' : 'bg-tile hover:bg-chip',
          )}
        >
          <SlidersHorizontal className="size-4" />
          Фільтри
          {activeCount > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={cn('size-4 transition-transform duration-300', filtersOpen && 'rotate-180')}
          />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-tile px-4 text-[15px] font-semibold transition-colors hover:bg-chip cursor-pointer"
            >
              <ArrowDownWideNarrow className="size-4 text-muted-foreground" />
              {sortLabel}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            {SORTS.map((s) => (
              <DropdownMenuItem
                key={s.value}
                onClick={() => updateParams({ sort: s.value === 'new' ? null : s.value })}
              >
                {s.label}
                {s.value === sortKey && <Check className="ml-auto size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {toolbarEnd && <div className="ml-auto w-full sm:w-auto">{toolbarEnd}</div>}
      </div>

      {/* Розгорнуті фільтри */}
      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            id="catalog-filters"
            key="filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <Tile className="flex flex-col gap-6 p-5 md:p-7">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="-mb-3 self-end text-sm font-semibold text-primary hover:opacity-80 cursor-pointer"
                >
                  Скинути все
                </button>
              )}
              <section className="flex flex-col gap-3">
                <h2 className="text-[13px] font-semibold text-muted-foreground">Статус</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={chipClass(!status)}
                    onClick={() => updateParams({ status: null })}
                  >
                    Будь-який
                  </button>
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={status === s.value}
                      className={chipClass(status === s.value)}
                      onClick={() => updateParams({ status: status === s.value ? null : s.value })}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[13px] font-semibold text-muted-foreground">Жанри</h2>
                  {selectedGenres.length > 1 && (
                    <div
                      className="flex gap-1 rounded-2xl bg-background p-1"
                      role="radiogroup"
                      aria-label="Режим жанрів"
                    >
                      {[
                        { all: false, label: 'Будь-який' },
                        { all: true, label: 'Усі вибрані' },
                      ].map((m) => (
                        <button
                          key={m.label}
                          type="button"
                          role="radio"
                          aria-checked={matchAll === m.all}
                          onClick={() => updateParams({ match: m.all ? 'all' : null })}
                          className={cn(
                            'min-h-8 rounded-lg px-3 text-[13px] font-semibold transition-colors cursor-pointer',
                            matchAll === m.all
                              ? 'bg-primary text-primary-foreground'
                              : 'text-soft hover:text-foreground',
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <label className="relative ml-auto w-full sm:w-60">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={genreQuery}
                      onChange={(e) => setGenreQuery(e.target.value)}
                      placeholder="Знайти жанр"
                      aria-label="Знайти жанр"
                      className="h-10 w-full rounded-xl bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                    />
                  </label>
                </div>
                <div
                  role="group"
                  aria-label="Жанри"
                  className="flex max-h-[260px] flex-wrap gap-2 overflow-y-auto"
                >
                  {genresData
                    ? visibleGenres.map((genre) => {
                        const active = selectedGenres.includes(genre.id)
                        const count = countsData ? (genreCounts.get(genre.id) ?? 0) : null
                        const empty = count === 0 && !active
                        return (
                          <button
                            key={genre.id}
                            type="button"
                            aria-pressed={active}
                            disabled={empty}
                            onClick={() => toggleGenre(genre.id)}
                            className={cn(
                              chipClass(active),
                              empty && 'pointer-events-none opacity-35',
                            )}
                          >
                            {active && <Check className="size-3.5" />}
                            {genre.title}
                            {count !== null && (
                              <span
                                className={cn(
                                  'text-xs tabular-nums',
                                  active ? 'opacity-70' : 'text-muted-foreground',
                                )}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        )
                      })
                    : Array.from({ length: 12 }).map((_, i) => (
                        <span key={i} className="h-10 w-24 animate-pulse rounded-xl bg-chip" />
                      ))}
                  {genresData && visibleGenres.length === 0 && (
                    <p className="text-sm text-muted-foreground">Жанр не знайдено</p>
                  )}
                </div>
              </section>
            </Tile>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Активні фільтри — видно навіть зі згорнутою панеллю */}
      {hasFilters && !filtersOpen && (
        <div className="flex flex-wrap items-center gap-2">
          {status && (
            <ActiveChip
              label={STATUSES.find((s) => s.value === status)?.label ?? status}
              onRemove={() => updateParams({ status: null })}
            />
          )}
          {selectedGenres.map((id) => (
            <ActiveChip
              key={id}
              label={genreById.get(id)?.title ?? '…'}
              onRemove={() => toggleGenre(id)}
            />
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="min-h-9 px-2 text-sm font-semibold text-primary hover:opacity-80 cursor-pointer"
          >
            Скинути все
          </button>
        </div>
      )}

      {/* Перше завантаження */}
      {booksLoading && !books && (
        <CoverGrid className="mt-2">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[2/3] w-full animate-pulse rounded-2xl bg-tile" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-tile" />
            </div>
          ))}
        </CoverGrid>
      )}

      {booksError && (
        <Tile className="mt-2 flex flex-col items-center gap-3 px-6 py-12 text-center">
          <h2 className="heading-display text-xl">Не вдалося завантажити {errorNoun}</h2>
          <p className="text-muted-foreground">Сталася помилка під час завантаження</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Спробувати знову
          </Button>
        </Tile>
      )}

      {books && (
        <div className={cn('transition-opacity duration-200', booksLoading && 'opacity-50')}>
          {books.docs.length > 0 ? (
            <CoverGrid className="mt-2">
              {books.docs.map((book) => (
                <BookCard book={book} key={book.id} overlay={renderOverlay?.(book)} />
              ))}
            </CoverGrid>
          ) : (
            <Tile className="mt-2 flex flex-col items-center gap-3 px-6 py-12 text-center">
              <h2 className="heading-display text-xl">
                {hasFilters ? 'Нічого не знайдено' : 'Поки що порожньо'}
              </h2>
              <p className="text-muted-foreground">
                {hasFilters
                  ? selectedGenres.length > 1 && matchAll
                    ? 'Немає книг з усіма вибраними жанрами одночасно. Спробуйте режим «Будь-який».'
                    : 'Спробуйте змінити фільтри'
                  : "Книги з'являться тут згодом"}
              </p>
              {hasFilters && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {selectedGenres.length > 1 && matchAll && (
                    <Button variant="secondary" onClick={() => updateParams({ match: null })}>
                      Будь-який із жанрів
                    </Button>
                  )}
                  <Button onClick={clearAll}>Скинути фільтри</Button>
                </div>
              )}
            </Tile>
          )}

          {books.totalPages > 1 && (
            <ChipPagination
              page={books.page || 1}
              totalPages={books.totalPages}
              hasPrevPage={books.hasPrevPage}
              hasNextPage={books.hasNextPage}
              onChange={(page) => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Прибрати фільтр «${label}»`}
      className="group inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-tile pl-3 pr-2 text-sm font-semibold transition-colors hover:bg-chip cursor-pointer"
    >
      {label}
      <X className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
    </button>
  )
}
