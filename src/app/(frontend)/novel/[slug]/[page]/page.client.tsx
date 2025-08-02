'use client'
import { stringify } from 'qs-esm'
import { BookChapter } from '@/payload-types'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, Edit, Menu, Settings } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
// import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AutoSizer, List } from 'react-virtualized'
import { useAuth } from '@/providers/auth'
import Comments from '@/components/comments'

const sizeOptions = [
  { label: 'Малий', value: 'prose-sm' },
  { label: 'Середній', value: 'prose-base' },
  { label: 'Великий', value: 'prose-lg' },
  { label: 'Дуже великий', value: 'prose-xl' },
  { label: 'Величезний', value: 'prose-2xl' },
]
const fontFamilyOptions = [
  { label: 'Санс', value: 'font-sans' },
  { label: 'Шериф', value: 'font-serif' },
  { label: 'Моно', value: 'font-mono' },
]

interface Settings {
  fontSize: string
  fontFamily: string
}

export type Props = {
  chapter: BookChapter
  page: number
  bookSlug: string
}
const ChaptersModal: React.FC<{
  bookSlug: string
  page: number
}> = ({ bookSlug, page }) => {
  const [chapters, setChapters] = useState<BookChapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetch, setIsFetch] = useState(false) // Фетчимо тільки під час першого відкриття списку
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const listRef = useRef<List>(null)

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const query = stringify({
          where: { 'book.slug': { equals: bookSlug } },
          select: {
            title: true,
            isSpoiler: true,
          },
          //sort by internal join field order
          sort: '_bookChapters_chapters_order',
          limit: 0,
        })
        const req = await fetch(`/api/bookChapters?${query}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await req.json()
        if (data && data?.docs) {
          setChapters(data?.docs)
        }
      } catch (err) {
        console.log(err)
      } finally {
        setIsLoading(false)
      }
    }
    if (isFetch) {
      fetchChapters()
      setIsFetch(true)
    }
  }, [bookSlug, isFetch])

  // Скролл до вибраної глави при відкритті списку та при завантаженні
  useEffect(() => {
    if (isSheetOpen && !isLoading) {
      const frame = requestAnimationFrame(() => {
        listRef.current?.scrollToRow(page + 2) //+2 щоб він не був в самому низу списку
      })
      return () => cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSheetOpen, isLoading])

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild onClick={() => setIsFetch(true)}>
        <Button variant="outline" size="icon">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Глави</SheetTitle>
          <SheetDescription className=" hidden">Список усіх глав</SheetDescription>
        </SheetHeader>

        {!isLoading && chapters.length > 0 ? (
          <div className="h-[calc(100vh-128px)]">
            <AutoSizer>
              {({ width, height }) => (
                <List
                  ref={listRef}
                  height={height}
                  rowCount={chapters.length}
                  rowHeight={64}
                  width={width}
                  rowRenderer={({ index, key, style }) => (
                    <div key={key} style={style} className="relative">
                      <Link
                        href={`/novel/${bookSlug}/${index + 1}`}
                        className={cn('w-full flex items-center px-4 hover:bg-muted h-16 ', {
                          'bg-secondary': page === index + 1,
                        })}
                      >
                        <span
                          className={cn(
                            'line-clamp-2',
                            chapters[index]?.isSpoiler
                              ? 'blur-sm hover:blur-none transition-all duration-300 text-spoiler'
                              : '',
                          )}
                        >
                          {chapters[index].title}
                        </span>
                      </Link>
                    </div>
                  )}
                />
              )}
            </AutoSizer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {isLoading ? (
              <Skeleton className="h-[calc(100vh-128px)] w-full mx-4" />
            ) : (
              <div className="text-muted-foreground">Не знайдено глави</div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
const SettingsOverlay: React.FC<{
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  page: number
  bookSlug: string
  chapterID: string
}> = ({ settings, setSettings, page, bookSlug, chapterID }) => {
  const [isHidden, setIsHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const threshold = 64 // скільки пікселів треба прокрутити, перш ніж ховати/показувати
    let ticking = false

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollDelta = currentScrollY - lastScrollY

          if (Math.abs(scrollDelta) >= threshold) {
            if (scrollDelta > 0) {
              // Прокрутка вниз
              setIsHidden(true)
            } else {
              // Прокрутка вгору
              setIsHidden(false)
            }
            setLastScrollY(currentScrollY)
          }

          ticking = false
        })

        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  return (
    <div
      className={cn(
        'w-screen fixed bottom-0 left-0 bg-background transition-transform',
        isHidden && 'translate-y-full',
      )}
    >
      <div className="container mx-auto max-w-[800px] py-4 flex gap-2 justify-between items-center">
        <ChaptersModal bookSlug={bookSlug} page={page} />
        <div className="flex gap-2 items-center">
          <EditInAdmin id={chapterID} />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex flex-col gap-2">
                Шрифт:
                <div className="flex gap-2 flex-wrap">
                  {fontFamilyOptions.map((option) => (
                    <Badge
                      className={`${option.value} cursor-pointer select-none text-lg px-2`}
                      key={option.value}
                      variant={settings.fontFamily === option.value ? 'default' : 'outline'}
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          fontFamily: option.value,
                        }))
                      }}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
                Розмір шрифту:
                <div className="flex gap-2 flex-wrap">
                  {sizeOptions.map((option) => (
                    <Badge
                      className="cursor-pointer select-none"
                      key={option.value}
                      variant={settings.fontSize === option.value ? 'default' : 'outline'}
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          fontSize: option.value,
                        }))
                      }}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {page > 1 && (
            <Button variant="outline" size="icon" asChild>
              <Link href={`/novel/${bookSlug}/${page - 1}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}

          <Button variant="outline" size="icon" asChild>
            <Link href={`/novel/${bookSlug}/${page + 1}`}>
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

const EditInAdmin: React.FC<{ id: string }> = ({ id }) => {
  const { user } = useAuth()
  // console.log('currentUser', currentUser)
  if (!user) return null
  if (!(user.roles.includes('admin') || user.roles.includes('editor'))) {
    return null
  }
  return (
    <Button variant="outline" asChild>
      <Link href={`/admin/collections/bookChapters/${id}`} target="_blank">
        <Edit />
        Редагувати
      </Link>
    </Button>
  )
}

const TextSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Fragment key={index}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </Fragment>
      ))}
    </div>
  )
}

const getInitialSettings = (): Settings => {
  if (typeof window === 'undefined')
    return {
      fontSize: 'prose-base',
      fontFamily: 'font-sans',
    }

  try {
    const stored = localStorage.getItem('settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        fontSize: parsed.fontSize || 'prose-base',
        fontFamily: parsed.fontFamily || 'font-sans',
      }
    }
  } catch (e) {
    console.error('Failed to parse settings', e)
  }

  return {
    fontSize: 'prose-base',
    fontFamily: 'font-sans',
  }
}
const ReadClientPage: React.FC<Props> = ({ chapter, page, bookSlug }) => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const [settings, setSettings] = useState<Settings>(getInitialSettings)
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     const progress = localStorage.getItem('readingProgress')
  //     const parsed = progress ? JSON.parse(progress) : {}
  //     parsed[bookSlug] = page > (parsed?.[bookSlug] || 0) ? page : parsed[bookSlug]
  //     localStorage.setItem('readingProgress', JSON.stringify(parsed))
  //   }
  // }, [bookSlug, page])

  useEffect(() => {
    const progress = localStorage.getItem('settings')
    if (progress) {
      const parsed = JSON.parse(progress)
      setSettings((prev) => ({
        ...prev,
        fontSize: parsed.fontSize || 'prose-base',
        fontFamily: parsed.fontFamily || 'font-sans',
      }))
    }
  }, [])
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings))
  }, [settings])

  if (typeof chapter.book === 'string') return null

  return (
    <div className="w-full">
      <div
        className="container mx-auto flex gap-2 justify-between items-center max-w-[800px] py-2 border-b"
        key={`${settings.fontSize}-${settings.fontFamily}`}
      >
        <Link href={`/novel/${bookSlug}`} className="text-lg font-bold flex gap-1 items-center">
          <ChevronLeft className="" />
          {chapter.book.title}
        </Link>
        <div className="flex gap-2 items-center">
          {page > 1 && (
            <Button variant="outline" size="icon" asChild>
              <Link href={`/novel/${bookSlug}/${page - 1}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}

          <Button variant="outline" size="icon" asChild>
            <Link href={`/novel/${bookSlug}/${page + 1}`}>
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-[800px] py-4">
        <h1
          className={cn(
            'text-3xl font-bold mb-2',
            chapter?.isSpoiler
              ? 'blur-sm hover:blur-none transition-all duration-300 text-spoiler'
              : '',
          )}
        >
          {chapter.title}
        </h1>
        {chapter?.isSpoiler && (
          <Badge className="mb-2" variant="outline">
            *Назва може містити спойлери
          </Badge>
        )}
        {isClient ? (
          <RichText data={chapter.content} className={cn(settings.fontSize, settings.fontFamily)} />
        ) : (
          <TextSkeleton />
        )}
        <Button variant="default" className="mt-4 mx-auto" asChild>
          <Link href={`/novel/${bookSlug}/${page + 1}`}>Наступний розділ</Link>
        </Button>
        <Comments chapterID={chapter?.id} />
      </div>

      <SettingsOverlay
        settings={settings}
        setSettings={setSettings}
        page={page}
        bookSlug={bookSlug}
        chapterID={chapter.id}
      />
    </div>
  )
}

export default ReadClientPage
