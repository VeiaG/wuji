'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

import { ChevronLeft, ChevronRight, X, PenLine, Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { stringify } from 'qs-esm'
import { PaginatedDocs, Where } from 'payload'
import { Book, BookGenre } from '@/payload-types'
import { BookCard } from '@/components/BookCard'
import { Badge } from '@/components/ui/badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const limit = 12

export default function OriginalsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])

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
    isLoading: booksLoading,
    error: booksError,
  } = useSWR<PaginatedDocs<Book>>(`/api/books?${buildQuery()}`, fetcher)

  // Fetch genres
  const { data: genresData, isLoading: genresLoading } = useSWR<PaginatedDocs<BookGenre>>(
    '/api/bookGenres',
    fetcher,
  )

  const genres = genresData?.docs || []

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
    <div className="container mx-auto py-6 px-4">
      {/* Intro */}
      <div className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <PenLine className="h-7 w-7 text-primary" />
          Оригінали
        </h1>
        <p className="text-muted-foreground mt-2">
          Авторські твори наших користувачів — від коротких уривків до повноцінних історій. Вони
          зберігаються окремо від каталогу перекладів.
        </p>
      </div>

      {/* Genre Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">Жанри:</h2>
          {selectedGenres.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-auto p-1"
            >
              <X className="h-3 w-3 mr-1" />
              Очистити
            </Button>
          )}
        </div>

        {genresLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 w-16 bg-muted rounded-full animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              if (typeof genre === 'string') return null
              const isSelected = selectedGenres.includes(genre.id)

              return (
                <Button
                  key={genre.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => (isSelected ? removeGenre(genre.id) : handleGenreSelect(genre.id))}
                  className="rounded-full text-xs h-8"
                >
                  {genre.title}
                  {isSelected && <X className="ml-1 h-3 w-3" />}
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center mb-6">
        {books && (
          <p className="text-muted-foreground">
            Знайдено {books.totalDocs} {books.totalDocs === 1 ? 'твір' : 'творів'}
          </p>
        )}
      </div>

      {/* Loading State */}
      {booksLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted aspect-[3/4] rounded-lg mb-2"></div>
              <div className="h-4 bg-muted rounded mb-1"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {booksError && (
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Сталася помилка при завантаженні творів</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Спробувати знову
          </Button>
        </div>
      )}

      {/* Books Grid */}
      {books && !booksLoading && (
        <>
          {books.docs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {books.docs.map((book) => {
                if (typeof book === 'string') return null
                return (
                  <div key={book.id} className="relative">
                    <BookCard book={book} />
                    {book.isAIAssisted && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        ШІ
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✍️</div>
              <h3 className="text-xl font-semibold mb-2">
                {hasFilters ? 'Нічого не знайдено' : 'Поки що немає оригіналів'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? 'Спробуйте змінити параметри пошуку або фільтри'
                  : "Авторські твори з'являться тут згодом"}
              </p>
              {hasFilters && (
                <Button onClick={clearAllFilters} variant="outline">
                  Очистити фільтри
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {books.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Сторінка {books.page || 1} з {books.totalPages}
                {books.totalDocs > 0 && (
                  <span className="ml-2">
                    ({((books.page || 1) - 1) * limit + 1}-
                    {Math.min((books.page || 1) * limit, books.totalDocs)} з {books.totalDocs})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={!books.hasPrevPage}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Попередня
                </Button>

                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, books.totalPages) }, (_, i) => {
                    let pageNum
                    if (books.totalPages <= 5) {
                      pageNum = i + 1
                    } else {
                      const current = books.page || 1
                      if (current <= 3) {
                        pageNum = i + 1
                      } else if (current >= books.totalPages - 2) {
                        pageNum = books.totalPages - 4 + i
                      } else {
                        pageNum = current - 2 + i
                      }
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === (books.page || 1) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(books.totalPages, prev + 1))}
                  disabled={!books.hasNextPage}
                  className="flex items-center gap-1"
                >
                  Наступна
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
