import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fontFamilyOptions, Settings, sizeOptions } from '@/globals/settings'
import { stringify } from 'qs-esm'
import { BookChapter } from '@/payload-types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, Edit, Menu, SettingsIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
// import { Separator } from '@/components/ui/separator'
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
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAuth } from '@/providers/auth'
const ChaptersModal: React.FC<{
  bookSlug: string
  page: number
}> = ({ bookSlug, page }) => {
  const [chapters, setChapters] = useState<BookChapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetch, setIsFetch] = useState(false) // Фетчимо тільки під час першого відкриття списку
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)

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

  // Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: chapters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  })

  // Скролл до вибраної глави при відкритті списку та при завантаженні
  useEffect(() => {
    if (isSheetOpen && !isLoading && chapters.length > 0) {
      const frame = requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(page + 2, { align: 'center' }) //+2 щоб він не був в самому низу списку
      })
      return () => cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSheetOpen, isLoading, chapters.length])

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild onClick={() => setIsFetch(true)}>
        <Button variant="outline" size="icon">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Розділи</SheetTitle>
          <SheetDescription className=" hidden">Список усіх розділів</SheetDescription>
        </SheetHeader>

        {!isLoading && chapters.length > 0 ? (
          <div ref={parentRef} className="h-[calc(100vh-128px)] overflow-auto">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <Link
                    href={`/novel/${bookSlug}/${virtualRow.index + 1}`}
                    className={cn('w-full flex items-center px-4 hover:bg-muted h-16 ', {
                      'bg-secondary': page === virtualRow.index + 1,
                    })}
                  >
                    <span
                      className={cn(
                        'line-clamp-2',
                        chapters[virtualRow.index]?.isSpoiler
                          ? 'blur-sm hover:blur-none transition-all duration-300 text-spoiler'
                          : '',
                      )}
                    >
                      {chapters[virtualRow.index].title}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {isLoading ? (
              <Skeleton className="h-[calc(100vh-128px)] w-full mx-4" />
            ) : (
              <div className="text-muted-foreground">Не знайдено розділу</div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
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
const SettingsOverlay: React.FC<{
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  page: number
  bookSlug: string
  chapterID: string
  isHidden: boolean
  setIsHidden: React.Dispatch<React.SetStateAction<boolean>>
}> = ({ settings, setSettings, page, bookSlug, chapterID, isHidden, setIsHidden }) => {
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
  }, [lastScrollY, setIsHidden])

  return (
    <div
      className={cn(
        'w-screen fixed bottom-0 left-0 bg-background/80 backdrop-blur-sm border-t transition-transform duration-300',
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
                <SettingsIcon />
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

export default SettingsOverlay
