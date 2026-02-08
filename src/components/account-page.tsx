'use client'
import { useAuth } from '@/providers/auth'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from '@bprogress/next/app'
import type { Bookmark, ReadProgress } from '@/payload-types'
import { stringify } from 'qs-esm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { Progress } from './ui/progress'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen,
  Settings,
  LogOut,
  Calendar,
  Star,
  BookMarked,
  Heart,
  Trash2,
  User,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import ConfirmDialog from './confirm-dialog'
import { getUserAvatarURL } from '@/lib/avatars'
import { getUserBadges } from '@/lib/supporters'
import { cn } from '@/lib/utils'

const ProgressCard = ({
  book,
  page,
  updatedAt,
  progressID,
  onRemove,
}: {
  book: ReadProgress['book']
  page: number
  updatedAt?: string
  progressID: string
  onRemove: (readProgressId: string) => void
}) => {
  if (!book || typeof book === 'string') return null

  const totalPages = book.chapterCount || 1 // Assuming chapterCount is the total number of pages
  const progressPercentage = Math.min((page / totalPages) * 100, 100)

  const handleRemoveReadProgress = async () => {
    if (!onRemove) return

    try {
      const res = await fetch(`/api/readProgress/${progressID}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        onRemove(progressID)
      }
    } catch (error) {
      console.error('Error removing read progress:', error)
    }
  }
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {typeof book.coverImage === 'object' && (
            <div className="relative flex-shrink-0">
              <Image
                src={book.coverImage?.url || ''}
                alt={book.coverImage?.alt || book.title}
                width={80}
                height={120}
                className="rounded-md object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-md" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link
              className="font-semibold text-sm line-clamp-2 mb-2 hover:underline"
              href={`/novel/${book.slug}`}
            >
              {book.title}
            </Link>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Сторінка {page} з {totalPages}
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5" />
              {updatedAt && (
                <div className="text-xs text-muted-foreground">
                  Оновлено {new Date(updatedAt).toLocaleDateString('uk-UA')}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="grow" asChild>
                  <Link href={`/novel/${book.slug}/${page}`}>Продовжити</Link>
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="outline" className="px-2">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  }
                  onConfirm={handleRemoveReadProgress}
                  title="Видалити прогрес читання"
                  description={`Ви впевнені, що хочете видалити прогрес читання для "${book.title}"? Цю дію не можна скасувати.`}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const BookmarkCard = ({
  bookmark,
  onRemove,
}: {
  bookmark: Bookmark
  onRemove?: (bookmarkId: string) => void
}) => {
  if (!bookmark.book || typeof bookmark.book === 'string') return null

  const handleRemoveBookmark = async () => {
    if (!onRemove) return

    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        onRemove(bookmark.id)
      }
    } catch (error) {
      console.error('Error removing bookmark:', error)
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {typeof bookmark.book.coverImage === 'object' && (
            <div className="relative flex-shrink-0">
              <Image
                src={bookmark.book.coverImage?.url || ''}
                alt={bookmark.book.coverImage?.alt || bookmark.book.title}
                width={80}
                height={120}
                className="rounded-md object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-md" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link
              className="font-semibold text-sm line-clamp-2 mb-2 hover:underline"
              href={`/novel/${bookmark.book.slug}`}
            >
              {bookmark.book.title}
            </Link>
            <div className="space-y-2">
              {bookmark.book.genres && Array.isArray(bookmark.book.genres) && (
                <div className="flex flex-wrap gap-1">
                  {bookmark.book.genres.slice(0, 2).map(
                    (genre) =>
                      typeof genre === 'object' && (
                        <Badge key={genre.id} variant="secondary" className="text-xs">
                          {genre.title}
                        </Badge>
                      ),
                  )}
                  {bookmark.book.genres.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{bookmark.book.genres.length - 2}
                    </span>
                  )}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Додано {new Date(bookmark.createdAt).toLocaleDateString('uk-UA')}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8" asChild>
                  <Link href={`/novel/${bookmark.book.slug}`}>Читати</Link>
                </Button>
                {onRemove && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={handleRemoveBookmark}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  description?: string
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
          {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
        </div>
      </div>
    </CardContent>
  </Card>
)

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

const AccountPage = () => {
  const { user, logout } = useAuth()
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

  const handleRemoveReadProgress = (readProgressId: string) => {
    setReadProgress((prev) => prev?.filter((progress) => progress.id !== readProgressId) || null)
    setStats((prev) => ({ ...prev, booksRead: prev.booksRead - 1 }))
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
          populate: {
            books: {
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
          limit: 10,
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

  if (!user && !isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Доступ заборонено</h1>
          <p className="text-muted-foreground mb-4">
            Увійдіть в обліковий запис для перегляду цієї сторінки
          </p>
          <Button asChild>
            <Link href="/login">Увійти</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingSkeleton />
      </div>
    )
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get background image from first book with cover
  const backgroundImage =
    (readProgresses &&
      readProgresses.length > 0 &&
      typeof readProgresses[0].book !== 'string' &&
      typeof readProgresses[0].book.coverImage === 'object' &&
      readProgresses[0].book.coverImage?.url) ||
    (bookmarkedBooks &&
      bookmarkedBooks.length > 0 &&
      typeof bookmarkedBooks[0].book !== 'string' &&
      typeof bookmarkedBooks[0].book.coverImage === 'object' &&
      bookmarkedBooks[0].book.coverImage?.url) ||
    null

  return (
    <div className="min-h-screen">
      {/* Background gradient */}
      {backgroundImage && (
        <div className="fixed inset-0 -z-20 w-screen h-screen">
          <Image
            src={backgroundImage}
            alt="Background"
            fill
            className="object-cover opacity-10 blur-xl pointer-events-none"
            priority
          />
        </div>
      )}

      {/* Header Section */}
      <div className="relative overflow-hidden border-b">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col gap-6">
            {/* User Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-border shadow-lg">
                <AvatarImage src={getUserAvatarURL(user)} alt={user?.nickname} />
                <AvatarFallback className="text-2xl">
                  {getUserInitials(user?.nickname || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{user?.nickname}</h1>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  {getUserBadges(user).map((badge) => {
                    if (badge.type === 'admin') {
                      return (
                        <Badge key={badge.type} variant="default" className="text-sm">
                          {badge.label}
                        </Badge>
                      )
                    }
                    if (badge.type === 'editor') {
                      return (
                        <Badge key={badge.type} variant="default" className="text-sm">
                          {badge.label}
                        </Badge>
                      )
                    }
                    if (badge.type === 'supporter') {
                      return (
                        <Badge
                          key={badge.type}
                          variant="outline"
                          className="text-sm bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/50"
                        >
                          {badge.label}
                        </Badge>
                      )
                    }
                    if (badge.type === 'reader') {
                      return (
                        <Badge key={badge.type} variant="secondary" className="text-sm">
                          {badge.label}
                        </Badge>
                      )
                    }
                    return null
                  })}
                  <Badge variant="outline" className="text-sm">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    {new Date(user?.createdAt || new Date()).toLocaleDateString('uk-UA')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="justify-start sm:justify-center" asChild>
                <Link href={`/profile/${user?.slug}`}>
                  <User className="h-4 w-4 mr-2" />
                  <span>Публічний профіль</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start sm:justify-center" asChild>
                <Link href="/settings?tab=account">
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Налаштування</span>
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="justify-start sm:justify-center"
                onClick={() => {
                  logout()
                  router.push('/login')
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Вийти</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2',
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Огляд
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2',
                activeTab === 'progress'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <BookMarked className="h-4 w-4" />
              Прогрес
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2',
                activeTab === 'bookmarks'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <Heart className="h-4 w-4" />
              Закладки
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Reading Progress */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <BookMarked className="h-5 w-5" />
                    Останнє читання
                  </h3>
                  {readProgresses && readProgresses.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('progress')}
                    >
                      Показати всі
                    </Button>
                  )}
                </div>
                {readProgresses && readProgresses.length > 0 ? (
                  <div className="space-y-3">
                    {readProgresses.slice(0, 3).map((progress) => (
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
                  <Card>
                    <CardContent className="p-6 text-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Почніть читати книги
                      </p>
                      <Button size="sm" asChild>
                        <Link href="/novels">Каталог</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Recent Bookmarks */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Останні закладки
                  </h3>
                  {bookmarkedBooks && bookmarkedBooks.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('bookmarks')}
                    >
                      Показати всі
                    </Button>
                  )}
                </div>
                {bookmarkedBooks && bookmarkedBooks.length > 0 ? (
                  <div className="space-y-3">
                    {bookmarkedBooks.slice(0, 3).map((bookmark) => (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onRemove={handleRemoveBookmark}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Додайте улюблені книги
                      </p>
                      <Button size="sm" asChild>
                        <Link href="/novels">Каталог</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Статистика
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={BookOpen} label="Книг у прогресі" value={stats.booksRead} />
                <StatCard icon={Heart} label="Закладок" value={stats.bookmarksCount} />
                <StatCard icon={Star} label="Улюблений жанр" value={stats.favoriteGenre} />
              </div>
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookMarked className="h-6 w-6 text-primary" />
                Прогрес читання
              </h2>
              {readProgresses && readProgresses.length > 0 && (
                <Badge variant="secondary">
                  {readProgresses.length}{' '}
                  {readProgresses.length === 1
                    ? 'книга'
                    : readProgresses.length >= 2 && readProgresses.length <= 4
                      ? 'книги'
                      : 'книг'}
                </Badge>
              )}
            </div>

            {readProgresses && readProgresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <CardTitle className="text-xl mb-2">Почніть своє читання</CardTitle>
                  <CardDescription className="mb-4">
                    Ви ще не почали читати жодної книги. Знайдіть щось цікаве для себе!
                  </CardDescription>
                  <Button asChild>
                    <Link href="/novels">Переглянути каталог</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                Мої закладки
              </h2>
              {bookmarkedBooks && bookmarkedBooks.length > 0 && (
                <Badge variant="secondary">
                  {bookmarkedBooks.length}{' '}
                  {bookmarkedBooks.length === 1
                    ? 'книга'
                    : bookmarkedBooks.length >= 2 && bookmarkedBooks.length <= 4
                      ? 'книги'
                      : 'книг'}
                </Badge>
              )}
            </div>

            {bookmarkedBooks && bookmarkedBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarkedBooks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onRemove={handleRemoveBookmark}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <CardTitle className="text-xl mb-2">Немає закладок</CardTitle>
                  <CardDescription className="mb-4">
                    Ви ще не додали жодної книги до закладок. Додайте книги, які вам сподобались!
                  </CardDescription>
                  <Button asChild>
                    <Link href="/novels">Переглянути каталог</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountPage
