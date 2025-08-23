'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { BookOpen, SunMoon, Trash2, Type } from 'lucide-react'
import { useLastReadPageContext } from '@/components/LastReadPageProvider'
import { fontFamilyOptions, getInitialSettings, Settings, sizeOptions } from '@/globals/settings'
import ThemeSwitcherCards from '@/components/theme-switcher'

const ReadingSettings = () => {
  const {
    settings: lastReadSettings,
    lastPage,
    updateSettings,
    clearLastPage,
  } = useLastReadPageContext()
  const [fontSettings, setFontSettings] = useState<Settings>(getInitialSettings)

  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Збереження налаштувань шрифту в localStorage
  useEffect(() => {
    const settings = localStorage.getItem('settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      setFontSettings((prev) => ({
        ...prev,
        fontSize: parsed.fontSize || 'prose-base',
        fontFamily: parsed.fontFamily || 'font-sans',
      }))
    }
  }, [])
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(fontSettings))
  }, [fontSettings])

  const formatLastRead = (page: typeof lastPage) => {
    if (!page) return 'Немає збереженої сторінки'

    const date = new Date(page.timestamp)
    return {
      book: page.title || page.slug,
      page: page.page,
      date: date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const lastReadInfo = formatLastRead(lastPage)

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-2">
        <BookOpen />
        <h2 className="text-xl font-medium">Налаштування читання</h2>
      </div>
      {isClient ? (
        <>
          {/* Автоматичне продовження */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="auto-resume" className="text-base">
                Автоматичне продовження
              </Label>
              <p className="text-sm text-muted-foreground">
                Відкривати останню прочитану сторінку при запуску застосунку
              </p>
            </div>
            <Switch
              id="auto-resume"
              checked={lastReadSettings.autoResume}
              onCheckedChange={(checked) => updateSettings({ autoResume: checked })}
            />
          </div>

          <Separator />

          {/* Термін зберігання */}
          <div className="space-y-2">
            <Label htmlFor="max-age" className="text-base">
              Зберігати останню сторінку протягом
            </Label>
            <Select
              value={lastReadSettings.maxAge.toString()}
              onValueChange={(value) => updateSettings({ maxAge: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 день</SelectItem>
                <SelectItem value="3">3 дні</SelectItem>
                <SelectItem value="7">1 тиждень</SelectItem>
                <SelectItem value="14">2 тижні</SelectItem>
                <SelectItem value="30">1 місяць</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Налаштування шрифту */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <Label className="text-base">Налаштування шрифту</Label>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Тип шрифту:</Label>
                <div className="flex gap-2 flex-wrap">
                  {fontFamilyOptions.map((option) => (
                    <Badge
                      className={`${option.value} cursor-pointer select-none text-lg px-3 py-1`}
                      key={`${option.value}-${fontSettings.fontFamily}`}
                      variant={fontSettings.fontFamily === option.value ? 'default' : 'outline'}
                      onClick={() => {
                        setFontSettings((prev) => ({
                          ...prev,
                          fontFamily: option.value,
                        }))
                      }}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Розмір шрифту:</Label>
                <div className="flex gap-2 flex-wrap">
                  {sizeOptions.map((option) => (
                    <Badge
                      className="cursor-pointer select-none px-3 py-1"
                      key={`${option.value}-${fontSettings.fontSize}`}
                      variant={fontSettings.fontSize === option.value ? 'default' : 'outline'}
                      onClick={() => {
                        setFontSettings((prev) => ({
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

              {/* Превью тексту */}
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Превью:</Label>
                <Card>
                  <CardContent>
                    <div
                      className={`prose ${fontSettings.fontSize} ${fontSettings.fontFamily} dark:prose-invert max-w-none`}
                    >
                      <p>
                        Це приклад тексту з обраними налаштуваннями шрифту. Тут ви можете побачити,
                        як виглядатиме текст під час читання книг.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <Separator />

          {/* Інформація про останню сторінку */}
          <div className="space-y-3">
            <Label className="text-base">Остання збережена сторінка</Label>

            {lastPage && typeof lastReadInfo !== 'string' ? (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{lastReadInfo.book}</p>
                        <p className="text-sm text-muted-foreground">
                          Сторінка {lastReadInfo.page}
                        </p>
                        <p className="text-xs text-muted-foreground">{lastReadInfo.date}</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearLastPage()
                      }}
                      className="w-full gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Очистити збережений прогрес
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Немає збереженої сторінки
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        <div>Завантаження...</div>
      )}
    </div>
  )
}

const AppearanceSettings = () => {
  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-2">
        <SunMoon />
        <h2 className="text-xl font-medium">Налаштування зовнішнього вигляду</h2>
      </div>
      <ThemeSwitcherCards />
    </div>
  )
}

const SETTINGS_PAGES = [
  {
    id: 'reading',
    button: 'Налаштування читання',
    component: ReadingSettings,
  },
  {
    id: 'appearance',
    button: 'Зовнішній вигляд',
    component: AppearanceSettings,
  },
]

const SettingsPage = () => {
  const [page, setPage] = useState(SETTINGS_PAGES[0].id)
  const ActiveComponent = SETTINGS_PAGES.find((setting) => setting.id === page)?.component

  return (
    <div className="container mx-auto py-8 space-y-2">
      <h1 className="text-2xl font-bold">Налаштування</h1>
      {/* Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <aside className="flex flex-col gap-2 lg:sticky top-8 h-fit">
          {SETTINGS_PAGES.map((setting) => (
            <Button
              key={setting.id}
              variant={page === setting.id ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setPage(setting.id)}
            >
              {setting.button}
            </Button>
          ))}
        </aside>
        <div className="relative col-span-1 lg:col-span-3">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
