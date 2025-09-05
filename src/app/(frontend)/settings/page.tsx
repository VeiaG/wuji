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
import { Input } from '@/components/ui/input'
import { BookOpen, SunMoon, Trash2, Type, User, Save, Loader2, Eye, Lock } from 'lucide-react'
import { useLastReadPageContext } from '@/components/LastReadPageProvider'
import { fontFamilyOptions, getInitialSettings, Settings, sizeOptions } from '@/globals/settings'
import ThemeSwitcherCards from '@/components/theme-switcher'
import { useAuth } from '@/providers/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { formatSlug } from '@/fields/slug/formatSlug'

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

const AccountSettings = () => {
  const { user, setUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true)

  // Track if changes were made
  const hasChanges = nickname !== (user?.nickname || '') || isPublic !== (user?.isPublic ?? true)

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '')
      setIsPublic(user.isPublic ?? true)
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    if (!hasChanges) {
      toast.info('Немає змін для збереження')
      return
    }

    if (!nickname.trim()) {
      toast.error('Нікнейм не може бути пустим')
      return
    }

    if (nickname.length < 3) {
      toast.error('Нікнейм повинен містити принаймні 3 символи')
      return
    }

    if (nickname.length > 50) {
      toast.error('Нікнейм не може містити більше 50 символів')
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Generate base slug from nickname
      const baseSlug = formatSlug(nickname.trim())
      
      // Step 2: Get unique slug from our API
      const slugResponse = await fetch('/api/generateSlug', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: baseSlug,
          currentUserId: user.id,
        }),
      })

      if (!slugResponse.ok) {
        const slugError = await slugResponse.json()
        toast.error(slugError.error || 'Помилка при генерації унікального slug')
        return
      }

      const { slug: uniqueSlug } = await slugResponse.json()
      
      // Step 3: Update user with unique slug
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          slug: uniqueSlug,
          isPublic,
        }),
      })

      if (!res.ok) {
        const data = await res.json()

        if (res.status === 400 && data.errors) {
          // Handle validation errors from Payload
          const errorMessages = data.errors
            .map(
              (error: {
                name: string
                message: string
                data: {
                  errors: {
                    message: string
                    path: string
                  }[]
                }
              }) => {
                if (error.name === 'ValidationError') {
                  const nicknamePathValidationError = error.data.errors.find(
                    (err) => err.path === 'nickname',
                  )
                  if (nicknamePathValidationError) {
                    //hardcoded message check, because Payload does not provide error codes
                    if (
                      nicknamePathValidationError.message.includes('Значення має бути унікальним.')
                    ) {
                      return 'Цей нікнейм вже зайнятий'
                    }
                    return nicknamePathValidationError.message
                  }
                }
                return error.message
              },
            )
            .join(', ')
          toast.error(errorMessages)
        } else if (data.message) {
          toast.error(data.message)
        } else {
          toast.error('Помилка при оновленні профілю')
        }
        return
      }

      const updatedUser = await res.json()

      // Update auth context
      if (setUser && user) {
        setUser({
          ...user,
          nickname: updatedUser.doc.nickname,
          isPublic: updatedUser.doc.isPublic,
          slug: updatedUser.doc.slug,
        })
      }

      toast.success('Налаштування успішно збережено!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Сталася помилка при збереженні налаштувань')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center gap-2">
          <User />
          <h2 className="text-xl font-medium">Налаштування акаунту</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Увійдіть в обліковий запис для доступу до налаштувань акаунту
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-2">
        <User />
        <h2 className="text-xl font-medium">Налаштування акаунту</h2>
      </div>

      {/* Profile Settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nickname">Нікнейм</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Введіть ваш нікнейм"
            maxLength={50}
          />
          <p className="text-sm text-muted-foreground">
            Ваш нікнейм буде видимий іншим користувачам. Мін. 3, макс. 50 символів.
          </p>
        </div>

        <Separator />

        {/* Privacy Settings */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              {isPublic ? <Eye className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              Публічний профіль
            </Label>
            <p className="text-sm text-muted-foreground">
              {isPublic
                ? 'Інші користувачі можуть бачити ваш прогрес читання та статистику'
                : 'Тільки нікнейм та дата реєстрації будуть видимі іншим користувачам'}
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setNickname(user.nickname || '')
              setIsPublic(user.isPublic ?? true)
            }}
            disabled={!hasChanges || isLoading}
          >
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Збереження...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Зберегти зміни
              </>
            )}
          </Button>
        </div>
      </div>
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
  {
    id: 'account',
    button: 'Налаштування акаунту',
    component: AccountSettings,
  },
]

const SettingsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromQuery = searchParams.get('tab')

  // Set initial page from URL query or default
  const initialPage = SETTINGS_PAGES.find((p) => p.id === tabFromQuery)?.id || SETTINGS_PAGES[0].id
  const [page, setPage] = useState(initialPage)

  const ActiveComponent = SETTINGS_PAGES.find((setting) => setting.id === page)?.component

  const handlePageChange = (newPage: string) => {
    setPage(newPage)
    // Update URL with query parameter
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('tab', newPage)
    router.replace(currentUrl.pathname + currentUrl.search)
  }

  // Update page state when URL query changes
  useEffect(() => {
    if (tabFromQuery && SETTINGS_PAGES.find((p) => p.id === tabFromQuery)) {
      setPage(tabFromQuery)
    }
  }, [tabFromQuery])

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
              onClick={() => handlePageChange(setting.id)}
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
