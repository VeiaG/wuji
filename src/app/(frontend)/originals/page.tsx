'use client'
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { stringify } from 'qs-esm'
import { PaginatedDocs, Where } from 'payload'
import { Book, BookGenre } from '@/payload-types'
import { BookCard } from '@/components/BookCard'
import { Chip, CoverGrid, Tile } from '@/components/bento'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const limit = 12

function OriginalsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Вибрані жанри живуть в URL (?genre=a,b): працюють посилання з головної/книги, оновлення сторінки й «Назад»
  const selectedGenres = useMemo(
    () => searchParams.get('genre')?.split(',').filter(Boolean) ?? [],
    [searchParams],
  )
  const setSelectedGenres = (ids: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    if (ids.length > 0) params.set('genre', ids.join(','))
    else params.delete('genre')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }
  // Жанр, з яким прийшли за посиланням, — показуємо першим у рядку чипів
  const [urlGenre] = useState<string | null>(() => selectedGenres[0] ?? null)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedGenres])

  // Build query parameters
  const buildQuery = () => {
    // Тільки авторські твори користувачів
    const where: Where = {
      origin: {
        equals: 'original',
      },
    }

    if (selectedGenres.length > 0) {
      where.genres = {
        in: selectedGenres,
      }
    }

    return stringify({
      page: currentPage,
      limit,
      where,
      sort: '-createdAt',
      // Обмежуємо поля, щоб не тягнути популяцію owner для кожної книги списку
      select: {
        title: true,
        slug: true,
        coverImage: true,
        genres: true,
        isAIAssisted: true,
      },
    })
  }

  // Fetch books
  const {
    data: books,
    isLoading: swrLoading,
    error: booksError,
  } = useSWR<PaginatedDocs<Book>>(`/api/books?${buildQuery()}`, fetcher)
  const booksLoading = swrLoading

  // Fetch genres
  const { data: genresData, isLoading: genresLoading } = useSWR<PaginatedDocs<BookGenre>>(
    // Усі жанри (за замовчуванням API віддає лише 10, а посилання ?genre= можуть вести на будь-який)
    '/api/bookGenres?limit=100&depth=0',
    fetcher,
  )

  // Жанр з URL ставимо першим, щоб на мобільному його було видно без прокрутки
  const allGenres = genresData?.docs || []
  const genres = urlGenre
    ? [...allGenres].sort((a, b) => Number(b.id === urlGenre) - Number(a.id === urlGenre))
    : allGenres

  const handleGenreSelect = (genreId: string) => {
    if (!selectedGenres.includes(genreId)) {
      setSelectedGenres([...selectedGenres, genreId])
    }
  }

  const removeGenre = (genreId: string) => {
    setSelectedGenres(selectedGenres.filter((id) => id !== genreId))
  }

  const clearAllFilters = () => {
    setSelectedGenres([])
  }

  const hasFilters = selectedGenres.length > 0

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      {/* Вступ */}
      <div className="flex flex-col gap-2">
        <h1 className="heading-display text-[32px] md:text-[44px]">Оригінали</h1>
        <p className="max-w-[640px] text-[15px] leading-relaxed text-soft md:text-base">
          Авторські твори наших користувачів — від коротких уривків до повноцінних історій. Вони
          зберігаються окремо від каталогу перекладів.
        </p>
        <p className="text-[15px] text-muted-foreground">
          {books ? (
            <>
              Знайдено {books.totalDocs} {books.totalDocs === 1 ? 'твір' : 'творів'}
            </>
          ) : (
            ' '
          )}
        </p>
      </div>

      {/* Жанри */}
      {genresLoading ? (
        <div className="flex flex-wrap gap-2 py-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 w-20 animate-pulse rounded-xl bg-tile" />
          ))}
        </div>
      ) : (
        <div
          role="group"
          aria-label="Жанри"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0"
        >
          <button type="button" onClick={clearAllFilters} className="shrink-0">
            <Chip active={!hasFilters}>Усі</Chip>
          </button>
          {genres.map((genre) => {
            if (typeof genre === 'string') return null
            const isSelected = selectedGenres.includes(genre.id)

            return (
              <button
                key={genre.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => (isSelected ? removeGenre(genre.id) : handleGenreSelect(genre.id))}
                className="shrink-0"
              >
                <Chip active={isSelected}>{genre.title}</Chip>
              </button>
            )
          })}
        </div>
      )}

      {/* Loading State */}
      {booksLoading && (
        <CoverGrid className="mt-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[2/3] w-full animate-pulse rounded-2xl bg-tile" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-tile" />
            </div>
          ))}
        </CoverGrid>
      )}

      {/* Error State */}
      {booksError && (
        <Tile className="mt-4 flex flex-col items-center gap-3 px-6 py-12 text-center">
          <h2 className="heading-display text-xl">Не вдалося завантажити твори</h2>
          <p className="text-muted-foreground">Сталася помилка при завантаженні творів</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Спробувати знову
          </Button>
        </Tile>
      )}

      {/* Books Grid */}
      {books && !booksLoading && (
        <>
          {books.docs.length > 0 ? (
            <CoverGrid className="mt-4">
              {books.docs.map((book) => {
                if (typeof book === 'string') return null
                return (
                  <BookCard
                    book={book}
                    key={book.id}
                    overlay={
                      book.isAIAssisted && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-background/80 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
                          <Sparkles className="size-3" />
                          ШІ
                        </span>
                      )
                    }
                  />
                )
              })}
            </CoverGrid>
          ) : (
            <Tile className="mt-4 flex flex-col items-center gap-3 px-6 py-12 text-center">
              <h2 className="heading-display text-xl">
                {hasFilters ? 'Нічого не знайдено' : 'Поки що немає оригіналів'}
              </h2>
              <p className="text-muted-foreground">
                {hasFilters
                  ? 'Спробуйте змінити параметри пошуку або фільтри'
                  : "Авторські твори з'являться тут згодом"}
              </p>
              {hasFilters && (
                <Button onClick={clearAllFilters} className="mt-2">
                  Очистити фільтри
                </Button>
              )}
            </Tile>
          )}

          {books.totalPages > 1 && (
            <ChipPagination
              page={books.page || 1}
              totalPages={books.totalPages}
              hasPrevPage={books.hasPrevPage}
              hasNextPage={books.hasNextPage}
              onChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  )
}

// Пагінація чипами: до 5 номерів навколо поточної сторінки
function ChipPagination({
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  onChange,
}: {
  page: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
  onChange: (page: number) => void
}) {
  const chip =
    'inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl bg-tile px-3 text-[15px] font-semibold text-soft transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav aria-label="Пагінація" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={!hasPrevPage}
        className={chip}
        aria-label="Попередня сторінка"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Попередня</span>
      </button>

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        let pageNum
        if (totalPages <= 5) {
          pageNum = i + 1
        } else if (page <= 3) {
          pageNum = i + 1
        } else if (page >= totalPages - 2) {
          pageNum = totalPages - 4 + i
        } else {
          pageNum = page - 2 + i
        }
        const active = pageNum === page

        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onChange(pageNum)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              chip,
              active && 'bg-primary text-primary-foreground hover:text-primary-foreground',
            )}
          >
            {pageNum}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={!hasNextPage}
        className={chip}
        aria-label="Наступна сторінка"
      >
        <span className="hidden sm:inline">Наступна</span>
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}

// useSearchParams потребує Suspense-межі для статичного рендеру
export default function Page() {
  return (
    <Suspense>
      <OriginalsPage />
    </Suspense>
  )
}
