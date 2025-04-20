'use client'

import { BookChapter } from '@/payload-types'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, Menu, Settings } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
// import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

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

const SettingsOverlay: React.FC<{
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  page: number
  bookSlug: string
}> = ({ settings, setSettings, page, bookSlug }) => {
  const [isHidden, setIsHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY) {
        // Прокрутка вниз
        setIsHidden(true)
      } else {
        // Прокрутка вгору
        setIsHidden(false)
      }

      setLastScrollY(currentScrollY)
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
        <div>
          <Button variant="outline" size="icon" disabled>
            <Menu />
          </Button>
        </div>
        <div className="flex gap-2 items-center">
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
  console.log('chapter', chapter)
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const [settings, setSettings] = useState<Settings>(getInitialSettings)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const progress = localStorage.getItem('readingProgress')
      const parsed = progress ? JSON.parse(progress) : {}
      parsed[bookSlug] = page > (parsed?.[bookSlug] || 0) ? page : parsed[bookSlug]
      localStorage.setItem('readingProgress', JSON.stringify(parsed))
    }
  }, [bookSlug, page])

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
        <h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
        {isClient ? (
          <RichText data={chapter.content} className={cn(settings.fontSize, settings.fontFamily)} />
        ) : (
          <TextSkeleton />
        )}
        <Button variant="default" className="mt-4 mx-auto" asChild>
          <Link href={`/novel/${bookSlug}/${page + 1}`}>Наступний розділ</Link>
        </Button>
      </div>
      <SettingsOverlay
        settings={settings}
        setSettings={setSettings}
        page={page}
        bookSlug={bookSlug}
      />
    </div>
  )
}

export default ReadClientPage
