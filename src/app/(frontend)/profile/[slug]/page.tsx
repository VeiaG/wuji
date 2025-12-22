import type React from 'react'
import { notFound } from 'next/navigation'
import { queryUserBySlug } from '@/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Calendar, User, BookOpen, Lock, BookMarked } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReadProgress } from '@/payload-types'
import { getUserAvatarURL, getUserBannerURL } from '@/lib/avatars'
import { cn } from '@/lib/utils'
import { getUserBadges } from '@/lib/supporters'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const ProgressCard = ({
  book,
  page,
  updatedAt,
}: {
  book: ReadProgress['book']
  page: number
  updatedAt?: string
}) => {
  if (!book || typeof book === 'string') return null

  const totalPages = book.chapterCount || 1
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
              {book.genres && Array.isArray(book.genres) && book.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {book.genres.slice(0, 2).map(
                    (genre) =>
                      typeof genre === 'object' && (
                        <Badge key={genre.id} variant="secondary" className="text-xs">
                          {genre.title}
                        </Badge>
                      ),
                  )}
                  {book.genres.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{book.genres.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const UserProfilePage: React.FC<Args> = async ({ params }) => {
  const { slug = '' } = await params
  const user = await queryUserBySlug({ slug })

  if (!user) return notFound()

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isPublic = user.isPublic
  const readProgresses = user.readProgresses || []
  const userBannerURL = getUserBannerURL(user)
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div
        className={cn(
          'relative overflow-hidden border-b',
          userBannerURL ? '' : 'bg-gradient-to-r from-background to-accent ',
        )}
      >
        {userBannerURL && (
          <div className="absolute inset-0 -z-10">
            <Image
              src={userBannerURL}
              alt={`${user.nickname} банер`}
              fill
              className="object-cover object-center opacity-100"
            />
          </div>
        )}
        <div className="relative container mx-auto px-0!  py-16 md:pb-0 md:pt-64 max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 bg-background/35  w-fit backdrop-blur-sm px-6 py-4 rounded-lg md:rounded-b-none">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-border shadow-lg">
                <AvatarImage src={getUserAvatarURL(user)} alt={user.nickname} />
                <AvatarFallback className="text-3xl md:text-4xl font-bold bg-muted">
                  {getUserInitials(user.nickname || '')}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight text-foreground">
                {user.nickname}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {getUserBadges(user).map((badge) => {
                  if (badge.type === 'admin') {
                    return (
                      <Badge key={badge.type} variant="default" className="text-base px-3 py-1">
                        {badge.label}
                      </Badge>
                    )
                  }
                  if (badge.type === 'editor') {
                    return (
                      <Badge key={badge.type} variant="default" className="text-base px-3 py-1">
                        {badge.label}
                      </Badge>
                    )
                  }
                  if (badge.type === 'supporter') {
                    return (
                      <Badge
                        key={badge.type}
                        variant="outline"
                        className="text-base px-3 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/50"
                      >
                        {badge.label}
                      </Badge>
                    )
                  }
                  if (badge.type === 'reader') {
                    return (
                      <Badge key={badge.type} variant="secondary" className="text-base px-3 py-1">
                        <User className="w-4 h-4 mr-2" />
                        {badge.label}
                      </Badge>
                    )
                  }
                  return null
                })}
                <Badge variant="outline" className="text-base px-3 py-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(user.createdAt).toLocaleDateString('uk-UA')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
      {userBannerURL && (
        <div className="fixed inset-0 -z-20 w-screen h-screen">
          <Image
            src={userBannerURL}
            alt={`${user.nickname} банер фон`}
            fill
            className="inset-0 object-cover opacity-10 blur-xl pointer-events-none"
            priority
          />
        </div>
      )}
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {!isPublic ? (
          // Private Profile View
          <div className="text-center py-16">
            <Card className="shadow-lg max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Приватний профіль</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Користувач {user.nickname} приховав інформацію свого профілю. Ви можете бачити
                  тільки нікнейм та дату приєднання.
                </p>
                <div className="flex justify-center gap-4">
                  <Badge variant="secondary" className="text-sm">
                    Приєднався {new Date(user.createdAt).getFullYear()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Public Profile View
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Stats Sidebar */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-8">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Статистика</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-foreground mb-1">
                        {readProgresses.length}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Книг у прогресі
                      </div>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground mb-1">
                        {new Date(user.createdAt).getFullYear()}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Рік реєстрації
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-4">
              {/* Reading Progress Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                      <BookMarked className="w-8 h-8 text-primary" />
                      Прогрес читання
                    </h2>
                    <p className="text-muted-foreground">Книги, які зараз читає {user.nickname}</p>
                  </div>

                  {readProgresses.length > 0 && (
                    <Badge variant="secondary" className="hidden md:flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
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
                  <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                    {readProgresses.map((progress) => (
                      <ProgressCard
                        key={progress.id}
                        book={progress.book}
                        page={progress.chapter || 0}
                        updatedAt={progress.updatedAt}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-16">
                    <CardContent className="pt-6">
                      <div className="max-w-md mx-auto">
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                          <BookOpen className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-xl font-semibold mb-3">
                          Немає активного читання
                        </CardTitle>
                        <CardDescription className="leading-relaxed">
                          Користувач {user.nickname} поки що не читає жодної книги або не має
                          активного прогресу читання.
                        </CardDescription>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfilePage
