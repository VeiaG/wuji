import type React from 'react'
import { notFound } from 'next/navigation'
import RichText from '@/components/RichText'
import { queryAuthorBySlug } from '@/queries'
import { BookCard } from '@/components/BookCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CheckCircle, BookOpen, User, LayoutGrid, ArrowRight, Library } from 'lucide-react'
import Image from 'next/image'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const AuthorPage: React.FC<Args> = async ({ params }) => {
  const { slug = '' } = await params
  const author = await queryAuthorBySlug({ slug })

  if (!author) return notFound()

  const bookCount = author.books?.docs?.length || 0
  const getBookCountText = (count: number) => {
    if (count === 1) return '1 книга'
    if (count >= 2 && count <= 4) return `${count} книги`
    return `${count} книг`
  }

  const lastBook =
    author.books?.docs && author.books.docs.length > 0
      ? author.books.docs[author.books.docs.length - 1]
      : null
  const lastBookSafe = typeof lastBook === 'string' ? null : lastBook

  return (
    <div className="min-h-screen ">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-background to-accent/10 border-b">
        <div className="relative container mx-auto px-4 py-16 md:py-24 max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Author Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-border shadow-lg">
                <AvatarFallback className="text-3xl md:text-4xl font-bold bg-muted">
                  {author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Author Info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight text-foreground">
                {author.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Автор
                </Badge>
                <Badge variant="outline" className="text-base px-3 py-1">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {getBookCountText(bookCount)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Author Bio Section - Full Width */}
        {typeof lastBookSafe?.coverImage === 'object' && (
          <Image
            src={lastBookSafe.coverImage?.url || ''}
            alt={lastBookSafe.coverImage?.alt || ''}
            width={lastBookSafe.coverImage?.width || 300}
            height={lastBookSafe.coverImage?.height || 450}
            className="fixed top-0 left-0 w-screen h-screen object-cover -z-10 opacity-10 blur-xl pointer-events-none"
            priority
          />
        )}
        {author.description && (
          <div className="mb-12">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <User className="w-6 h-6 text-primary" />
                  Про автора
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none text-muted-foreground ">
                  <RichText data={author.description} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Статистика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Book Count */}
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-foreground mb-1">{bookCount}</div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {bookCount === 1
                        ? 'Книга'
                        : bookCount >= 2 && bookCount <= 4
                          ? 'Книги'
                          : 'Книг'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Books Section */}
          <div className="lg:col-span-4">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Твори автора</h2>
                  <p className="text-muted-foreground">
                    Досліджуйте літературну спадщину {author.name}
                  </p>
                </div>

                {bookCount > 0 && (
                  <Badge variant="secondary" className="hidden md:flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Показано {Math.min(bookCount, author.books?.docs?.length || 0)} з {bookCount}
                  </Badge>
                )}
              </div>

              {author.books?.docs && author.books.docs.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {author.books.docs.map((book, index) => {
                      if (typeof book === 'string') return null
                      return <BookCard key={book.id || index} book={book} />
                    })}
                  </div>

                  {author.books?.hasNextPage && (
                    <div className="mt-12 text-center">
                      <Button size="lg" className="group">
                        <span>Показати більше</span>
                        <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="text-center py-16">
                  <CardContent className="pt-6">
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Library className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-xl font-semibold mb-3">
                        Поки що немає опублікованих творів
                      </CardTitle>
                      <CardDescription className="leading-relaxed">
                        У цього автора поки що немає опублікованих книг в нашій бібліотеці.
                        Слідкуйте за оновленнями!
                      </CardDescription>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthorPage
