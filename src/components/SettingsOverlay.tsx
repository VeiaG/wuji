import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fontFamilyOptions, Settings, sizeOptions } from '@/globals/settings'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, Edit, Menu, SettingsIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
// import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import ChapterListSheet from '@/components/ChapterListSheet'
import { useAuth } from '@/providers/auth'

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
        <ChapterListSheet bookSlug={bookSlug} page={page}>
          <Button variant="outline" size="icon">
            <Menu />
          </Button>
        </ChapterListSheet>
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
