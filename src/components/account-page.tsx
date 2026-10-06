'use client'
import { useAuth } from '@/providers/auth'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from '@bprogress/next/app'
import type { Bookmark, ReadProgress } from '@/payload-types'
import { stringify } from 'qs-esm'
import { useReadProgressContext } from './ReadProgressProvider'
import { Skeleton } from './ui/skeleton'
import Link from 'next/link'
import { Settings, LogOut } from 'lucide-react'
import { ProgressCard, BookmarkCard } from './library-cards'
import { getUserAvatarURL } from '@/lib/avatars'
import { getUserBadges } from '@/lib/supporters'
import { cn } from '@/lib/utils'
import { StatTile, Tile } from './bento'

const LoadingSkeleton = () => (
  <div className="container-page flex flex-col gap-3.5 pt-2">
    <div className="flex flex-col gap-3.5 lg:flex-row">
      <Skeleton className="h-[180px] rounded-tile lg:flex-[2]" />
      <Skeleton className="h-[180px] rounded-tile lg:flex-1" />
    </div>
    <Skeleton className="h-[52px] w-72 rounded-2xl" />
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      <Skeleton className="h-80 rounded-tile" />
      <Skeleton className="h-80 rounded-tile" />
    </div>
  </div>
)

const EmptyState = ({ title, text }: { title: string; text: string }) => (
  <div className="flex flex-col items-center gap-3 rounded-tile-sm bg-chip/60 px-6 py-10 text-center">
    <span className="heading-display text-xl">{title}</span>
    <span className="max-w-sm text-[15px] text-muted-foreground">{text}</span>
    <Button asChild className="mt-1">
      <Link href="/novels">До каталогу</Link>
    </Button>
  </div>
)

const pluralBooks = (count: number) =>
  count % 10 === 1 && count % 100 !== 11
    ? 'книга'
    : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)
      ? 'книги'
      : 'книг'

const AccountPage = () => {
  const { user, logout } = useAuth()
  const { clearProgress } = useReadProgressContext()
  const [readProgresses, setReadProgress] = useState<ReadProgress[] | null>(null)
  const [bookmarkedBooks, setBookmarkedBooks] = useState<Bookmark[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()
  const [stats, setStats] = useState({
    booksRead: 0,
    favoriteGenre: '',
    bookmarksCount: 0,
  })

  const handleRemoveBookmark = (bookmarkId: string) => {
    setBookmarkedBooks((prev) => prev?.filter((bookmark) => bookmark.id !== bookmarkId) || null)
    setStats((prev) => ({ ...prev, bookmarksCount: prev.bookmarksCount - 1 }))
  }

  const handleRemoveReadProgress = async (readProgressId: string) => {
    // Find the book ID from the progress item
    const progress = readProgresses?.find((p) => p.id === readProgressId)
    if (progress) {
      const bookId = typeof progress.book === 'string' ? progress.book : progress.book?.id
      if (bookId) {
        await clearProgress(bookId)
        setReadProgress((prev) => prev?.filter((p) => p.id !== readProgressId) || null)
      }
    }
  }

  useEffect(() => {
    if (!readProgresses && !bookmarkedBooks) return
    const booksReading = readProgresses?.length || 0
    const bookmarksCount = bookmarkedBooks?.length || 0

    const genresCount: Record<string, number> = {}
    readProgresses?.forEach((progress) => {
      if (typeof progress.book === 'string') return

      if (typeof progress.book.genres === 'string') return
      if (progress.book && progress.book.genres) {
        progress.book.genres.forEach((genre) => {
          if (typeof genre === 'string') return
          genresCount[genre.title] = (genresCount[genre.title] || 0) + 1
        })
      }
    })

    setStats({
      booksRead: booksReading,
      favoriteGenre:
        Object.entries(genresCount).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0] ||
        'Немає даних',
      bookmarksCount,
    })
  }, [readProgresses, bookmarkedBooks])

  useEffect(() => {
    if (!user) {
      return
    }

    const fetchReadProgress = async () => {
      try {
        const queryString = stringify({
          where: {
            user: { equals: user.id },
          },
          select: {
            book: true,
            chapter: true,
            updatedAt: true,
          },
          sort: '-updatedAt',
          populate: {
            book: {
              title: true,
              slug: true,
              coverImage: true,
              genres: true,
              chapterCount: true,
            },
            genres: {
              title: true,
            },
          },
          limit: 1000,
        })

        const res = await fetch(`/api/readProgress?${queryString}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          throw new Error('Failed to fetch read progress')
        }

        const data = await res.json()
        setReadProgress(data.docs)
      } catch (error) {
        console.error('Error fetching read progress:', error)
        setReadProgress([])
      }
    }

    const fetchBookmarkedBooks = async () => {
      try {
        const queryString = stringify({
          where: {
            user: { equals: user.id },
          },
          select: {
            book: true,
            createdAt: true,
          },
          sort: '-createdAt',
          populate: {
            book: {
              title: true,
              slug: true,
              coverImage: true,
              genres: true,
            },
          },
          limit: 0, // Fetch all bookmarked books
        })

        const res = await fetch(`/api/bookmarks?${queryString}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          throw new Error('Failed to fetch bookmarked books')
        }

        const data = await res.json()
        setBookmarkedBooks(data.docs)
      } catch (error) {
        console.error('Error fetching bookmarked books:', error)
        setBookmarkedBooks([])
      }
    }

    const fetchData = async () => {
      await Promise.all([fetchReadProgress(), fetchBookmarkedBooks()])
      setIsLoading(false)
    }

    fetchData()
  }, [user])

  if (user === null) {
    return (
      <div className="container-page pt-2">
        <Tile className="mx-auto flex max-w-lg flex-col items-center gap-4 p-10 text-center">
          <h1 className="heading-display text-2xl">Профіль</h1>
          <p className="text-muted-foreground">Увійдіть в обліковий запис, щоб бачити свій прогрес і закладки.</p>
          <Button asChild size="lg">
            <Link href="/login">Увійти</Link>
          </Button>
        </Tile>
      </div>
    )
  }

  if (isLoading || !user) return <LoadingSkeleton />

  const current = readProgresses?.find((progress) => typeof progress.book === 'object')
  const currentBook = current && typeof current.book === 'object' ? current.book : null
  const currentTotal = currentBook?.chapterCount || current?.chapter || 1
  const currentPercent = current ? Math.min(100, Math.round((current.chapter / currentTotal) * 100)) : 0
  const hasCustomAvatar = typeof user.avatar === 'object' && !!user.avatar?.url

  const tabs = [
    { id: 'overview', label: 'Огляд' },
    { id: 'progress', label: 'Прогрес' },
    { id: 'bookmarks', label: 'Закладки' },
  ]

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <section className="flex flex-col gap-3.5 lg:flex-row">
        {/* Шапка профілю */}
        <Tile className="flex flex-wrap items-center gap-5 p-6 md:gap-7 md:p-8 lg:flex-[2_1_0%]">
          <span
            className={cn(
              'grid size-20 shrink-0 place-items-center overflow-hidden rounded-[24px] font-display text-3xl font-extrabold md:size-24',
              hasCustomAvatar ? 'bg-chip' : 'bg-primary text-primary-foreground',
            )}
          >
            {hasCustomAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getUserAvatarURL(user)} alt={user.nickname} className="size-full object-cover" />
            ) : (
              user.nickname?.charAt(0).toUpperCase()
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <h1 className="heading-display text-[28px] wrap-anywhere md:text-[36px]">{user.nickname}</h1>
            <div className="flex flex-wrap gap-2">
              {getUserBadges(user).map((badge) => (
                <span
                  key={badge.type}
                  className={cn(
                    'rounded-[10px] px-3 py-1.5 text-[13px] font-semibold',
                    badge.type === 'admin' || badge.type === 'editor'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-chip text-soft',
                  )}
                >
                  {badge.label}
                </span>
              ))}
              <span className="rounded-[10px] bg-chip px-3 py-1.5 text-[13px] font-semibold text-soft">
                з {new Date(user.createdAt || new Date()).toLocaleDateString('uk-UA')}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button asChild variant="secondary" className="h-11 flex-1 sm:flex-none">
              <Link href={`/profile/${user.slug}`}>Публічний профіль</Link>
            </Button>
            <Button asChild variant="secondary" size="icon" className="size-11" aria-label="Налаштування">
              <Link href="/settings?tab=account">
                <Settings className="size-[18px]" />
              </Link>
            </Button>
            <Button
              variant="secondary"
              className="h-11"
              onClick={() => {
                logout()
                router.push('/login')
              }}
            >
              <LogOut className="size-4" />
              Вийти
            </Button>
          </div>
        </Tile>

        {/* Зараз читаєте */}
        {current && currentBook ? (
          <Link
            href={`/novel/${currentBook.slug}/${current.chapter}`}
            className="flex min-h-[180px] flex-col gap-2 rounded-tile bg-primary p-6 text-primary-foreground transition-opacity hover:opacity-95 lg:flex-1"
          >
            <span className="text-sm font-bold">Зараз читаєте</span>
            <span className="font-display text-[22px] font-extrabold leading-[1.15] line-clamp-2">
              {currentBook.title}
            </span>
            <span className="flex-1" />
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">
                Розділ {current.chapter} з {currentTotal}
              </span>
              <span className="font-display text-[44px] font-extrabold leading-none tracking-[-0.04em]">
                {currentPercent}%
              </span>
            </span>
            <span className="block h-2 overflow-hidden rounded-full bg-black/20">
              <span
                className="block h-full rounded-full bg-primary-foreground"
                style={{ width: `${currentPercent}%` }}
              />
            </span>
          </Link>
        ) : (
          <Link
            href="/novels"
            className="flex min-h-[180px] flex-col gap-2 rounded-tile bg-primary p-6 text-primary-foreground lg:flex-1"
          >
            <span className="text-sm font-bold">Зараз читаєте</span>
            <span className="font-display text-[22px] font-extrabold leading-[1.15]">Ще нічого</span>
            <span className="flex-1" />
            <span className="text-sm font-semibold">Оберіть книгу в каталозі →</span>
          </Link>
        )}
      </section>

      {/* Вкладки */}
      <nav
        aria-label="Розділи профілю"
        className="mt-2.5 inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-2xl bg-tile p-[5px]"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={cn(
              'min-h-[42px] shrink-0 rounded-xl px-5 text-[15px] font-bold transition-colors cursor-pointer',
              activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-soft hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <>
          <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <Tile className="flex flex-col gap-4 p-5 md:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="heading-display text-[22px]">Останнє читання</h2>
                {readProgresses && readProgresses.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('progress')}
                    className="text-sm font-semibold text-primary hover:opacity-90 cursor-pointer"
                  >
                    Показати всі →
                  </button>
                )}
              </div>
              {readProgresses && readProgresses.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {readProgresses.slice(0, 3).map((progress) => (
                    <ProgressCard
                      key={progress.id}
                      progressID={progress.id}
                      book={progress.book}
                      page={progress.chapter || 0}
                      updatedAt={progress.updatedAt}
                      className="bg-chip"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="Почніть читати" text="Тут з'явиться прогрес книг, які ви читаєте." />
              )}
            </Tile>

            <Tile className="flex flex-col gap-4 p-5 md:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="heading-display text-[22px]">Закладки</h2>
                {bookmarkedBooks && bookmarkedBooks.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookmarks')}
                    className="text-sm font-semibold text-primary hover:opacity-90 cursor-pointer"
                  >
                    Усі →
                  </button>
                )}
              </div>
              {bookmarkedBooks && bookmarkedBooks.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {bookmarkedBooks.slice(0, 3).map((bookmark) => (
                    <BookmarkCard key={bookmark.id} bookmark={bookmark} className="bg-chip" />
                  ))}
                </div>
              ) : (
                <EmptyState title="Немає закладок" text="Додавайте книги в закладки кнопкою на сторінці книги." />
              )}
            </Tile>
          </section>

          <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <StatTile label="Книг у прогресі" value={stats.booksRead} />
            <StatTile label="Закладок" value={stats.bookmarksCount} />
            <StatTile
              label="Улюблений жанр"
              value={<span className="text-[22px]">{stats.favoriteGenre}</span>}
            />
          </section>
        </>
      )}

      {activeTab === 'progress' && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="heading-display text-[26px]">Прогрес читання</h2>
            {readProgresses && readProgresses.length > 0 && (
              <span className="text-[15px] text-muted-foreground">
                {readProgresses.length} {pluralBooks(readProgresses.length)}
              </span>
            )}
          </div>
          {readProgresses && readProgresses.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {readProgresses.map((progress) => (
                <ProgressCard
                  key={progress.id}
                  progressID={progress.id}
                  book={progress.book}
                  page={progress.chapter || 0}
                  updatedAt={progress.updatedAt}
                  onRemove={handleRemoveReadProgress}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Почніть своє читання"
              text="Ви ще не почали читати жодної книги. Знайдіть щось цікаве для себе!"
            />
          )}
        </section>
      )}

      {activeTab === 'bookmarks' && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="heading-display text-[26px]">Мої закладки</h2>
            {bookmarkedBooks && bookmarkedBooks.length > 0 && (
              <span className="text-[15px] text-muted-foreground">
                {bookmarkedBooks.length} {pluralBooks(bookmarkedBooks.length)}
              </span>
            )}
          </div>
          {bookmarkedBooks && bookmarkedBooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {bookmarkedBooks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} onRemove={handleRemoveBookmark} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Немає закладок"
              text="Ви ще не додали жодної книги до закладок. Додайте книги, які вам сподобались!"
            />
          )}
        </section>
      )}
    </div>
  )
}

export default AccountPage
