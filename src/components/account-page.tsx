'use client'
import { useAuth } from '@/providers/auth'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import type { ReadProgress } from '@/payload-types'
import { stringify } from 'qs-esm'
import { Card, CardContent } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Skeleton } from './ui/skeleton'
import { Progress } from './ui/progress'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Settings, LogOut, Calendar, Star, BookMarked } from 'lucide-react'

const ProgressCard = ({ book, page }: { book: ReadProgress['book']; page: number }) => {
  if (!book || typeof book === 'string') return null

  // Mock progress calculation - you can replace with actual logic
  const totalPages = 250 // This should come from your book data
  const progressPercentage = Math.min((page / totalPages) * 100, 100)

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
            <h3 className="font-semibold text-sm line-clamp-2 mb-2">{book.title}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Сторінка {page} з {totalPages}
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5" />
              <Button size="sm" variant="outline" className="w-full h-8" asChild>
                <Link href={`/novel/${book.slug}/${page}`}>Продовжити</Link>
              </Button>
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
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
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [stats, setStats] = useState({
    booksRead: 0,
    favoriteGenre: '',
  })
  useEffect(() => {
    if (!readProgresses) return
    const bookdReading = readProgresses.length
    const genresCount: Record<string, number> = {}
    readProgresses.forEach((progress) => {
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
      booksRead: bookdReading,
      favoriteGenre: Object.entries(genresCount).reduce(
        (a, b) => (b[1] > a[1] ? b : a),
        ['', 0],
      )[0],
    })
  }, [readProgresses])

  useEffect(() => {
    if (!user) {
      // setIsLoading(false)
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
          },
          populate: {
            books: {
              title: true,
              slug: true,
              coverImage: true,
              genres: true,
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
      } finally {
        setIsLoading(false)
      }
    }

    fetchReadProgress()
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=' + user?.nickname}
              alt={user?.nickname}
            />
            <AvatarFallback className="text-lg">
              {getUserInitials(user?.nickname || '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user?.nickname}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              Приєднався {new Date(user?.createdAt || new Date()).toLocaleDateString('uk-UA')}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">Читач</Badge>
              {user?.roles.includes('admin') && <Badge className="text-xs">Адміністратор</Badge>}
              {user?.roles.includes('editor') && <Badge className="text-xs">Редактор</Badge>}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Settings className="h-4 w-4 mr-2" />
            Налаштування
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              logout()
              router.push('/login')
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Вийти
          </Button>
        </div>
      </div>

      {/* Statistics Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Статистика читання</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard icon={BookOpen} label="Книг у прогресі" value={stats.booksRead} />
          <StatCard icon={Star} label="Улюблений жанр" value={stats.favoriteGenre} />
        </div>
      </div>

      <Separator />

      {/* Reading Progress Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookMarked className="h-5 w-5" />
            Поточний прогрес читання
          </h2>
        </div>

        {readProgresses && readProgresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readProgresses.map((progress) => (
              <ProgressCard key={progress.id} book={progress.book} page={progress.chapter || 0} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Почніть своє читання</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Ви ще не почали читати жодної книги. Знайдіть щось цікаве для себе!
              </p>
              <Button asChild>
                <Link href="/novels">Переглянути каталог</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AccountPage
