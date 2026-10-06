'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tile } from '@/components/bento'
import { Loader2, Upload, ImagePlus, X } from 'lucide-react'
import { useLastReadPageContext } from '@/components/LastReadPageProvider'
import { useReadProgressContext } from '@/components/ReadProgressProvider'
import { BookProgress } from '@/hooks/useReadProgress'
import {
  fontFamilyOptions,
  getInitialSettings,
  readerBackgroundOptions,
  readingModeOptions,
  Settings,
  sizeOptions,
} from '@/globals/settings'
import PalettePicker from '@/components/palette-picker'
import { useSnow } from '@/providers/SnowProvider'
import { useAuth } from '@/providers/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { formatSlug } from '@/fields/slug/formatSlug'
import { getUserBadges } from '@/lib/supporters'
import { getUserAvatarURL, getUserBannerURL } from '@/lib/avatars'
import {
  DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB,
  DEFAULT_USER_UPLOAD_MIN_ACCOUNT_AGE_DAYS,
  USER_UPLOAD_ACCEPT,
  USER_UPLOAD_ALLOWED_MIME_TYPES,
  mbToBytes,
} from '@/lib/uploadLimits'
import { daysUntilUploadsUnlocked } from '@/lib/userUploadAccess'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Спільні стилі груп опцій
const segmentedWrap = 'inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-background p-[5px]'
const segmentClass = (active: boolean) =>
  cn(
    'inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-xl px-5 text-[15px] font-bold transition-colors cursor-pointer',
    active ? 'bg-primary text-primary-foreground' : 'text-soft hover:text-foreground',
  )
const chipClass = (active: boolean) =>
  cn(
    'min-h-11 rounded-xl px-4 text-sm font-semibold transition-colors cursor-pointer',
    active ? 'bg-foreground text-background' : 'bg-chip text-soft hover:text-foreground',
  )

const bgSwatch: Record<string, string> = {
  theme: 'bg-background',
  light: 'bg-[#f7f5f2] text-[#1c1917]',
  sepia: 'bg-[#f4ecd8] text-[#3b2f22]',
}

const maxAgeOptions = [
  { label: '1 день', value: 1 },
  { label: '3 дні', value: 3 },
  { label: '1 тиждень', value: 7 },
  { label: '2 тижні', value: 14 },
  { label: '1 місяць', value: 30 },
]

const TileTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="heading-display text-[22px]">{children}</h2>
)

const Field = ({
  label,
  description,
  children,
}: {
  label: string
  description?: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-1">
      <span className="text-[15px] font-bold">{label}</span>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {children}
  </div>
)

const ToggleRow = ({
  id,
  label,
  description,
  children,
}: {
  id: string
  label: string
  description: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-[15px] font-bold">
        {label}
      </Label>
      <p id={`${id}-description`} className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
    {children}
  </div>
)

const ReadingSettings = () => {
  const { settings: lastReadSettings, updateSettings } = useLastReadPageContext()
  const { getLastRead } = useReadProgressContext()
  const [lastRead, setLastRead] = useState<BookProgress | null>(null)
  const [fontSettings, setFontSettings] = useState<Settings>(getInitialSettings)

  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
    getLastRead().then(setLastRead)
  }, [getLastRead])

  // Збереження налаштувань шрифту в localStorage
  useEffect(() => {
    setFontSettings(getInitialSettings())
  }, [])
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(fontSettings))
  }, [fontSettings])

  const updateFontSettings = (partial: Partial<Settings>) =>
    setFontSettings((prev) => ({ ...prev, ...partial }))

  const formatLastRead = (progress: BookProgress | null) => {
    if (!progress) return null

    const date = new Date(progress.timestamp)
    return {
      book: progress.title || progress.bookSlug,
      page: progress.chapter.toString(),
      date: date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const lastReadInfo = formatLastRead(lastRead)

  return (
    <Tile className="flex flex-col gap-7 p-6 md:p-8">
      <TileTitle>Читання</TileTitle>
      {isClient ? (
        <>
          <Field
            label="Режим читання"
            description={
              fontSettings.readingMode === 'paginated'
                ? 'Текст розбивається на сторінки. Навігація: drag, свайп або стрілки клавіатури.'
                : 'Класичний режим з вертикальним прокручуванням.'
            }
          >
            <div className={cn(segmentedWrap, 'self-start')}>
              {readingModeOptions.map((option) => {
                const active = fontSettings.readingMode === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    className={segmentClass(active)}
                    onClick={() =>
                      updateFontSettings({ readingMode: option.value as Settings['readingMode'] })
                    }
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Шрифт">
            <div className={cn(segmentedWrap, 'self-start')}>
              {fontFamilyOptions.map((option) => {
                const active = fontSettings.fontFamily === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    className={cn(
                      segmentClass(active),
                      // Санс у читалці — системний, а не шрифт інтерфейсу
                      option.value === 'font-sans'
                        ? 'font-[family-name:var(--font-reader-sans)]'
                        : option.value,
                    )}
                    onClick={() => updateFontSettings({ fontFamily: option.value })}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Розмір тексту">
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((option) => {
                const active = fontSettings.fontSize === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    className={chipClass(active)}
                    onClick={() => updateFontSettings({ fontSize: option.value })}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Фон тексту" description="Сайт лишається темним — змінюється лише фон тексту в читалці.">
            <div className="grid max-w-md grid-cols-3 gap-2">
              {readerBackgroundOptions.map((option) => {
                const active = fontSettings.readerBackground === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateFontSettings({ readerBackground: option.value })}
                    className={cn(
                      'flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold ring-1 ring-border transition cursor-pointer',
                      bgSwatch[option.value],
                      active && 'ring-2 ring-primary',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Прев'ю тексту */}
          <Field label="Прев'ю">
            <div
              data-reader-bg={fontSettings.readerBackground}
              className={cn(
                'rounded-2xl p-5 text-foreground',
                fontSettings.readerBackground === 'theme' ? 'bg-chip' : 'bg-background',
              )}
            >
              <div
                className={`prose ${fontSettings.fontSize} ${fontSettings.fontFamily} dark:prose-invert max-w-none`}
              >
                <p>
                  Це приклад тексту з обраними налаштуваннями шрифту. Тут ви можете побачити, як
                  виглядатиме текст під час читання книг.
                </p>
              </div>
            </div>
          </Field>

          {/* Автоматичне продовження */}
          <ToggleRow
            id="auto-resume"
            label="Автоматичне продовження"
            description="Відкривати останню прочитану сторінку при запуску застосунку"
          >
            <Switch
              id="auto-resume"
              aria-describedby="auto-resume-description"
              checked={lastReadSettings.autoResume}
              onCheckedChange={(checked) => updateSettings({ autoResume: checked })}
            />
          </ToggleRow>

          {/* Термін зберігання */}
          <Field label="Зберігати останню сторінку протягом">
            <div className="flex flex-wrap gap-2">
              {maxAgeOptions.map((option) => {
                const active = lastReadSettings.maxAge === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    className={chipClass(active)}
                    onClick={() => updateSettings({ maxAge: option.value })}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Інформація про останню сторінку */}
          <Field label="Остання збережена сторінка">
            {lastRead && lastReadInfo ? (
              <div className="flex flex-col gap-1 rounded-2xl bg-chip p-4">
                <p className="text-[15px] font-semibold">{lastReadInfo.book}</p>
                <p className="text-sm text-soft">Сторінка {lastReadInfo.page}</p>
                <p className="text-[13px] text-muted-foreground">{lastReadInfo.date}</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-chip p-4 text-sm text-muted-foreground">
                Немає збереженої сторінки
              </div>
            )}
          </Field>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[52px] w-64 rounded-2xl" />
          <Skeleton className="h-[52px] w-72 rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      )}
    </Tile>
  )
}

const AppearanceSettings = () => {
  const { isSnowEnabled, toggleSnow } = useSnow()

  return (
    <Tile className="flex flex-col gap-7 p-6 md:p-8">
      <TileTitle>Вигляд</TileTitle>
      <PalettePicker />

      {/* Сніг */}
      <ToggleRow
        id="snow-effect"
        label="Новорічний сніг"
        description="Додати святковий ефект снігопаду на сайт"
      >
        <Switch
          id="snow-effect"
          aria-describedby="snow-effect-description"
          checked={isSnowEnabled}
          onCheckedChange={toggleSnow}
        />
      </ToggleRow>
    </Tile>
  )
}

/**
 * Клієнтська перевірка файлу — суто для швидкого фідбеку у формі.
 * Справжні обмеження (тип, розмір, кількість, частота) стоять на сервері,
 * у хуку `enforceUserUploadLimits`.
 */
const validateImageFile = (file: File): string | null => {
  if (!USER_UPLOAD_ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Підтримуються лише зображення: PNG, JPG, WEBP або GIF'
  }
  if (file.size > mbToBytes(DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB)) {
    return `Розмір файлу не повинен перевищувати ${DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB} МБ`
  }
  return null
}

/** Дістає зрозуміле повідомлення з відповіді Payload про помилку */
const readApiError = async (res: Response, fallback: string): Promise<string> => {
  try {
    const data = await res.json()
    const message = data?.errors?.[0]?.message
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  } catch {
    // тіло не JSON — віддаємо запасний текст
  }
  return fallback
}

const AccountSettings = () => {
  const { user, setUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  // Скільки днів має прожити акаунт, щоб отримати аватар/банер.
  // Значення налаштовується адміном, тож тягнемо його з глобалу;
  // константа — лише запасний варіант, поки запит не відповів.
  const [minAccountAgeDays, setMinAccountAgeDays] = useState(
    DEFAULT_USER_UPLOAD_MIN_ACCOUNT_AGE_DAYS,
  )

  // Form state
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true)
  const [notifyOnBookComments, setNotifyOnBookComments] = useState(
    user?.notifyOnBookComments ?? true,
  )

  // Anyone who can own an original book (writers and admins) gets this preference.
  const canOwnBooks = user?.roles?.some((role) => role === 'writer' || role === 'admin') ?? false

  // Track if changes were made
  const hasChanges =
    nickname !== (user?.nickname || '') ||
    isPublic !== (user?.isPublic ?? true) ||
    (canOwnBooks && notifyOnBookComments !== (user?.notifyOnBookComments ?? true))

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '')
      setIsPublic(user.isPublic ?? true)
      setNotifyOnBookComments(user.notifyOnBookComments ?? true)
    }
  }, [user])

  useEffect(() => {
    let cancelled = false

    const loadUploadSettings = async () => {
      try {
        const res = await fetch('/api/globals/general-settings?depth=0')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && typeof data?.userUploadMinAccountAgeDays === 'number') {
          setMinAccountAgeDays(data.userUploadMinAccountAgeDays)
        }
      } catch {
        // не критично — покажемо значення за замовчуванням
      }
    }

    loadUploadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  // Пошта не підтверджується, тож аватар відкривається лише «обжитим» акаунтам.
  // Реальну перевірку робить сервер — тут лише не даємо тицяти кнопку намарно.
  const daysUntilUploads = daysUntilUploadsUnlocked(user, minAccountAgeDays)
  const canPersonalize = daysUntilUploads === 0

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const validationError = validateImageFile(file)
    if (validationError) {
      toast.error(validationError)
      // без цього повторний вибір того самого файлу не спрацює
      e.target.value = ''
      return
    }

    setUploadingAvatar(true)

    try {
      // Step 1: Upload file to user-uploads collection
      const formData = new FormData()
      formData.append('file', file)
      // owner тут не передаємо: сервер проставляє власника сам
      // (defaultValue поля + enforceUserUploadLimits), а значення з форми
      // все одно зрізає field access
      formData.append('_payload', JSON.stringify({}))

      const uploadRes = await fetch('/api/user-uploads', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error(await readApiError(uploadRes, 'Сталася помилка при завантаженні аватарки'))
      }

      const uploadData = await uploadRes.json()

      // Step 2: Update user with new avatar ID
      const updateRes = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: uploadData.doc.id,
        }),
      })

      if (!updateRes.ok) {
        throw new Error(await readApiError(updateRes, 'Не вдалося оновити аватарку'))
      }

      const updatedUser = await updateRes.json()

      // Update auth context
      if (setUser) {
        setUser({
          ...user,
          avatar: updatedUser.doc.avatar,
        })
      }

      toast.success('Аватарку успішно оновлено!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error(
        error instanceof Error ? error.message : 'Сталася помилка при завантаженні аватарки',
      )
    } finally {
      setUploadingAvatar(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const validationError = validateImageFile(file)
    if (validationError) {
      toast.error(validationError)
      // без цього повторний вибір того самого файлу не спрацює
      e.target.value = ''
      return
    }

    setUploadingBanner(true)

    try {
      // Step 1: Upload file to user-uploads collection
      const formData = new FormData()
      formData.append('file', file)
      // owner тут не передаємо: сервер проставляє власника сам
      // (defaultValue поля + enforceUserUploadLimits), а значення з форми
      // все одно зрізає field access
      formData.append('_payload', JSON.stringify({}))

      const uploadRes = await fetch('/api/user-uploads', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error(await readApiError(uploadRes, 'Сталася помилка при завантаженні банера'))
      }

      const uploadData = await uploadRes.json()

      // Step 2: Update user with new banner ID
      const updateRes = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          banner: uploadData.doc.id,
        }),
      })

      if (!updateRes.ok) {
        throw new Error(await readApiError(updateRes, 'Не вдалося оновити банер'))
      }

      const updatedUser = await updateRes.json()

      // Update auth context
      if (setUser) {
        setUser({
          ...user,
          banner: updatedUser.doc.banner,
        })
      }

      toast.success('Банер успішно оновлено!')
    } catch (error) {
      console.error('Error uploading banner:', error)
      toast.error(
        error instanceof Error ? error.message : 'Сталася помилка при завантаженні банера',
      )
    } finally {
      setUploadingBanner(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user) return

    setUploadingAvatar(true)

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: null,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to remove avatar')
      }

      // const updatedUser = await res.json()

      // Update auth context
      if (setUser) {
        setUser({
          ...user,
          avatar: null,
        })
      }

      toast.success('Аватарку успішно видалено!')
    } catch (error) {
      console.error('Error removing avatar:', error)
      toast.error('Сталася помилка при видаленні аватарки')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveBanner = async () => {
    if (!user) return

    setUploadingBanner(true)

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          banner: null,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to remove banner')
      }

      // const updatedUser = await res.json()

      // Update auth context
      if (setUser) {
        setUser({
          ...user,
          banner: null,
        })
      }

      toast.success('Банер успішно видалено!')
    } catch (error) {
      console.error('Error removing banner:', error)
      toast.error('Сталася помилка при видаленні банера')
    } finally {
      setUploadingBanner(false)
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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
          ...(canOwnBooks && { notifyOnBookComments }),
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
          notifyOnBookComments: updatedUser.doc.notifyOnBookComments,
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
      <Tile className="flex flex-col gap-5 p-6 md:p-8">
        <TileTitle>Акаунт</TileTitle>
        <div className="flex flex-col items-center gap-3 rounded-tile-sm bg-chip/60 px-6 py-10 text-center">
          <span className="heading-display text-xl">Потрібен вхід</span>
          <span className="max-w-sm text-[15px] text-muted-foreground">
            Увійдіть в обліковий запис для доступу до налаштувань акаунту
          </span>
          <Button asChild className="mt-1">
            <Link href={`/login?redirect=${encodeURIComponent('/settings?tab=account')}`}>
              Увійти
            </Link>
          </Button>
        </div>
      </Tile>
    )
  }

  const bannerURL = getUserBannerURL(user)

  return (
    <Tile className="flex flex-col gap-7 p-6 md:p-8">
      <TileTitle>Акаунт</TileTitle>

      {/* Профіль */}
      <Field
        label="Нікнейм"
        description="Ваш нікнейм буде видимий іншим користувачам. Мін. 3, макс. 50 символів."
      >
        <Input
          id="nickname"
          aria-label="Нікнейм"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Введіть ваш нікнейм"
          maxLength={50}
          className="h-12 max-w-md"
        />
      </Field>

      {/* Приватність */}
      <ToggleRow
        id="public-profile"
        label="Публічний профіль"
        description={
          isPublic
            ? 'Інші користувачі можуть бачити ваш прогрес читання та статистику'
            : 'Тільки нікнейм та дата реєстрації будуть видимі іншим користувачам'
        }
      >
        <Switch
          id="public-profile"
          aria-describedby="public-profile-description"
          checked={isPublic}
          onCheckedChange={setIsPublic}
        />
      </ToggleRow>

      {/* Сповіщення для авторів */}
      {canOwnBooks && (
        <ToggleRow
          id="notify-book-comments"
          label="Сповіщення про коментарі"
          description="Отримувати сповіщення, коли хтось коментує розділ вашої книги"
        >
          <Switch
            id="notify-book-comments"
            aria-describedby="notify-book-comments-description"
            checked={notifyOnBookComments}
            onCheckedChange={setNotifyOnBookComments}
          />
        </ToggleRow>
      )}

      {/* Кнопки збереження */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          className="h-11"
          onClick={() => {
            setNickname(user.nickname || '')
            setIsPublic(user.isPublic ?? true)
            setNotifyOnBookComments(user.notifyOnBookComments ?? true)
          }}
          disabled={!hasChanges || isLoading}
        >
          Скасувати
        </Button>
        <Button className="h-11" onClick={handleSave} disabled={!hasChanges || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Збереження...
            </>
          ) : (
            'Зберегти зміни'
          )}
        </Button>
      </div>

      {/* Персоналізація профілю — аватар і банер, доступні всім користувачам */}
      <div className="flex flex-col gap-6 border-t border-border/60 pt-7">
        <div className="flex flex-col gap-1">
          <h3 className="heading-display text-lg">Персоналізація профілю</h3>
          <p className="text-sm text-muted-foreground">
            Налаштуйте свою аватарку та банер профілю — так вас бачитимуть інші читачі
          </p>
        </div>

        {!canPersonalize && (
          <div className="rounded-2xl bg-chip p-4 text-sm text-soft">
            Аватарка й банер відкриваються через {minAccountAgeDays} днів після реєстрації —
            зачекайте ще {daysUntilUploads} дн.
          </div>
        )}

        {/* Аватар */}
        <Field label="Аватарка">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-20 rounded-[24px]">
              <AvatarImage src={getUserAvatarURL(user)} alt={user.nickname} className="object-cover" />
              <AvatarFallback className="rounded-[24px] bg-primary font-display text-2xl font-extrabold text-primary-foreground">
                {getUserInitials(user.nickname || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="h-11"
                  disabled={uploadingAvatar || !canPersonalize}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Завантаження...
                    </>
                  ) : (
                    <>
                      <Upload className="size-4" />
                      Завантажити
                    </>
                  )}
                </Button>
                {user.avatar && (
                  <Button
                    variant="secondary"
                    className="h-11"
                    disabled={uploadingAvatar}
                    onClick={handleRemoveAvatar}
                  >
                    <X className="size-4" />
                    Видалити
                  </Button>
                )}
              </div>
              <p className="text-[13px] text-muted-foreground">
                PNG, JPG, WEBP або GIF до {DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB} МБ. Рекомендовано
                квадратне зображення.
              </p>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept={USER_UPLOAD_ACCEPT}
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </Field>

        {/* Банер */}
        <Field label="Банер профілю">
          {bannerURL ? (
            <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-chip md:h-40">
              <Image src={bannerURL} alt="Банер профілю" fill className="object-cover" />
            </div>
          ) : (
            <div className="grid h-32 w-full place-items-center rounded-2xl bg-chip md:h-40">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="size-7" />
                <p className="text-sm">Немає банера</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="h-11"
              disabled={uploadingBanner || !canPersonalize}
              onClick={() => document.getElementById('banner-upload')?.click()}
            >
              {uploadingBanner ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Завантаження...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Завантажити банер
                </>
              )}
            </Button>
            {user.banner && (
              <Button
                variant="secondary"
                className="h-11"
                disabled={uploadingBanner}
                onClick={handleRemoveBanner}
              >
                <X className="size-4" />
                Видалити банер
              </Button>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">
            PNG, JPG, WEBP або GIF до {DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB} МБ. Рекомендовано
            1200x400 пікселів.
          </p>
          <input
            id="banner-upload"
            type="file"
            accept={USER_UPLOAD_ACCEPT}
            className="hidden"
            onChange={handleBannerUpload}
          />
        </Field>

        {/* Прев'ю профілю */}
        <Field label="Прев'ю профілю" description="Так виглядатиме ваш публічний профіль для інших користувачів">
          <div className="overflow-hidden rounded-tile-sm bg-chip">
            <div className="relative h-28 bg-primary/15 md:h-36">
              {bannerURL && (
                <Image src={bannerURL} alt="Прев'ю банера" fill className="object-cover" />
              )}
            </div>
            <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
              <Avatar className="-mt-10 size-20 rounded-[24px] ring-4 ring-chip md:size-24">
                <AvatarImage src={getUserAvatarURL(user)} alt={user.nickname} className="object-cover" />
                <AvatarFallback className="rounded-[24px] bg-primary font-display text-2xl font-extrabold text-primary-foreground">
                  {getUserInitials(user.nickname || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-2 pt-3">
                <span className="heading-display text-xl break-words md:text-[28px]">
                  {nickname || user.nickname}
                </span>
                <div className="flex flex-wrap gap-2">
                  {getUserBadges(user).map((badge) => (
                    <span
                      key={badge.type}
                      className={cn(
                        'rounded-[10px] px-3 py-1.5 text-[13px] font-semibold',
                        badge.type === 'admin' || badge.type === 'editor'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-tile text-soft',
                      )}
                    >
                      {badge.label}
                    </span>
                  ))}
                  <span className="rounded-[10px] bg-tile px-3 py-1.5 text-[13px] font-semibold text-soft">
                    з {new Date(user.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Field>
      </div>
    </Tile>
  )
}

const SETTINGS_PAGES = [
  {
    id: 'reading',
    button: 'Читання',
    component: ReadingSettings,
  },
  {
    id: 'appearance',
    button: 'Вигляд',
    component: AppearanceSettings,
  },
  {
    id: 'account',
    button: 'Акаунт',
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
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <h1 className="heading-display text-[32px] md:text-[44px]">Налаштування</h1>
      <nav
        aria-label="Розділи налаштувань"
        className="mt-1 inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-2xl bg-tile p-[5px]"
      >
        {SETTINGS_PAGES.map((setting) => (
          <button
            key={setting.id}
            type="button"
            onClick={() => handlePageChange(setting.id)}
            aria-current={page === setting.id ? 'page' : undefined}
            className={cn(
              'min-h-[42px] shrink-0 rounded-xl px-5 text-[15px] font-bold transition-colors cursor-pointer',
              page === setting.id
                ? 'bg-primary text-primary-foreground'
                : 'text-soft hover:text-foreground',
            )}
          >
            {setting.button}
          </button>
        ))}
      </nav>
      <div className="max-w-[880px]">{ActiveComponent && <ActiveComponent />}</div>
    </div>
  )
}

export default SettingsPage
