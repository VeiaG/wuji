'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tile } from '@/components/bento'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Camera,
  Check,
  History,
  ImagePlus,
  Loader2,
  Lock,
  Palette,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Type,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
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
const segmentedWrap =
  'inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-background p-[5px] [scrollbar-width:none]'
const segmentClass = (active: boolean) =>
  cn(
    'inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-bold transition-colors cursor-pointer',
    active ? 'bg-primary text-primary-foreground' : 'text-soft hover:text-foreground',
  )

// Зразки фону тексту — ті самі кольори, що й у [data-reader-bg] у styles.css
const bgSwatch: Record<string, string> = {
  theme: 'bg-background text-foreground',
  light: 'bg-[#f7f5f2] text-[#1c1917]',
  sepia: 'bg-[#f4ecd8] text-[#3b2f22]',
}

// Розміри літери «А» на кнопках розміру тексту (по зростанню, як sizeOptions)
const sizeGlyph = ['text-[13px]', 'text-[15px]', 'text-[18px]', 'text-[21px]', 'text-[24px]']

const maxAgeOptions = [
  { label: '1 день', value: 1 },
  { label: '3 дні', value: 3 },
  { label: 'Тиждень', value: 7 },
  { label: '2 тижні', value: 14 },
  { label: 'Місяць', value: 30 },
]

/** Заголовок плитки з іконкою */
const SectionTitle = ({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) => (
  <div className="flex items-start gap-3.5">
    <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-chip text-primary">
      <Icon className="size-5" />
    </span>
    <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
      <h2 className="heading-display text-lg md:text-xl">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  </div>
)

const Field = ({
  label,
  description,
  aside,
  children,
}: {
  label: string
  description?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-bold">{label}</span>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {aside}
    </div>
    {children}
  </div>
)

/** Рядок з перемикачем: клікабельний весь текст, а не лише сам перемикач */
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
  <div className="-mx-3 flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-chip/60">
    <label htmlFor={id} className="flex flex-1 cursor-pointer flex-col gap-1">
      <span className="text-[15px] font-bold">{label}</span>
      <span id={`${id}-description`} className="text-sm text-muted-foreground">
        {description}
      </span>
    </label>
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
    setFontSettings(getInitialSettings())
    getLastRead().then(setLastRead)
  }, [getLastRead])

  // Зберігаємо лише на зміну користувачем — інакше початковий рендер міг би затерти збережене
  const updateFontSettings = (partial: Partial<Settings>) =>
    setFontSettings((prev) => {
      const next = { ...prev, ...partial }
      localStorage.setItem('settings', JSON.stringify(next))
      return next
    })

  const lastReadDate = lastRead
    ? new Date(lastRead.timestamp).toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null
  const currentSize = sizeOptions.find((option) => option.value === fontSettings.fontSize)

  return (
    <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex min-w-0 flex-col gap-3.5">
        <Tile className="flex flex-col gap-7 p-6 md:p-8">
          <SectionTitle icon={Type} title="Текст" description="Як виглядають розділи в читалці" />
          {isClient ? (
            <>
              <Field
                label="Режим читання"
                description={
                  fontSettings.readingMode === 'paginated'
                    ? 'Текст розбивається на сторінки. Гортайте свайпом, перетягуванням або стрілками.'
                    : 'Класичне вертикальне прокручування.'
                }
              >
                <div className={cn(segmentedWrap, 'self-start')}>
                  {readingModeOptions.map((option) => {
                    const active = fontSettings.readingMode === option.value
                    const Icon = option.value === 'paginated' ? BookOpen : ScrollText
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        className={segmentClass(active)}
                        onClick={() =>
                          updateFontSettings({
                            readingMode: option.value as Settings['readingMode'],
                          })
                        }
                      >
                        <Icon className="size-4" />
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

              <Field
                label="Розмір тексту"
                aside={<span className="text-sm text-muted-foreground">{currentSize?.label}</span>}
              >
                <div className={cn(segmentedWrap, 'self-start')}>
                  {sizeOptions.map((option, i) => {
                    const active = fontSettings.fontSize === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        aria-label={option.label}
                        title={option.label}
                        className={cn(segmentClass(active), 'w-12 px-0 font-display', sizeGlyph[i])}
                        onClick={() => updateFontSettings({ fontSize: option.value })}
                      >
                        А
                      </button>
                    )
                  })}
                </div>
              </Field>

              <Field
                label="Фон тексту"
                description="Сайт лишається темним — змінюється лише фон тексту."
              >
                <div className="grid max-w-lg grid-cols-3 gap-2.5">
                  {readerBackgroundOptions.map((option) => {
                    const active = fontSettings.readerBackground === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateFontSettings({ readerBackground: option.value })}
                        className={cn(
                          'relative flex h-[84px] flex-col justify-between rounded-2xl p-3 text-left ring-1 ring-foreground/10 transition-shadow cursor-pointer',
                          bgSwatch[option.value],
                          active && 'ring-2 ring-primary',
                        )}
                      >
                        <span className="font-serif text-2xl leading-none">Аа</span>
                        <span className="text-[13px] font-semibold">{option.label}</span>
                        {active && (
                          <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </>
          ) : (
            <div className="flex flex-col gap-5">
              <Skeleton className="h-[52px] w-64 rounded-2xl" />
              <Skeleton className="h-[52px] w-72 rounded-2xl" />
              <Skeleton className="h-[52px] w-80 rounded-2xl" />
              <Skeleton className="h-[84px] w-full max-w-lg rounded-2xl" />
            </div>
          )}
        </Tile>

        <Tile className="flex flex-col gap-6 p-6 md:p-8">
          <SectionTitle
            icon={History}
            title="Продовження читання"
            description="Сайт пам'ятає, де ви зупинились"
          />
          <ToggleRow
            id="auto-resume"
            label="Автоматичне продовження"
            description="Відкривати останній розділ, коли заходите на головну"
          >
            <Switch
              id="auto-resume"
              aria-describedby="auto-resume-description"
              checked={lastReadSettings.autoResume}
              onCheckedChange={(checked) => updateSettings({ autoResume: checked })}
            />
          </ToggleRow>

          <Field label="Пам'ятати останній розділ">
            <div className={cn(segmentedWrap, 'self-start')}>
              {maxAgeOptions.map((option) => {
                const active = lastReadSettings.maxAge === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    className={cn(segmentClass(active), 'px-3.5 text-sm')}
                    onClick={() => updateSettings({ maxAge: option.value })}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </Field>

          {isClient &&
            (lastRead ? (
              <Link
                href={`/novel/${lastRead.bookSlug}/${lastRead.chapter}`}
                className="group flex items-center gap-4 rounded-2xl bg-chip p-4 transition-colors hover:bg-foreground/10"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] text-muted-foreground">Останній розділ</span>
                  <span className="truncate text-[15px] font-bold">
                    {lastRead.title || lastRead.bookSlug}
                  </span>
                  <span className="text-sm text-soft">
                    Розділ {lastRead.chapter} · {lastReadDate}
                  </span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ) : (
              <div className="rounded-2xl bg-chip p-4 text-sm text-muted-foreground">
                Поки немає збереженого розділу
              </div>
            ))}
        </Tile>
      </div>

      {/* Живе прев'ю — як шматок сторінки читалки */}
      <Tile className="flex flex-col gap-3 p-3 lg:sticky lg:top-4">
        <div className="flex items-center justify-between px-3 pt-2">
          <span className="text-[13px] font-semibold text-muted-foreground">Прев&apos;ю</span>
          {isClient && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-chip px-2.5 py-1 text-xs font-semibold text-soft">
              {fontSettings.readingMode === 'paginated' ? (
                <BookOpen className="size-3.5" />
              ) : (
                <ScrollText className="size-3.5" />
              )}
              {readingModeOptions.find((o) => o.value === fontSettings.readingMode)?.label}
            </span>
          )}
        </div>
        <div
          data-reader-bg={isClient ? fontSettings.readerBackground : 'theme'}
          className="min-h-[340px] rounded-[20px] bg-background px-6 py-7 text-foreground transition-colors"
        >
          <span className="text-[13px] font-semibold text-muted-foreground">Розділ 1</span>
          <h3 className="heading-display mb-4 mt-1 text-[22px]">Початок шляху</h3>
          <div
            className={cn(
              'prose max-w-none dark:prose-invert',
              isClient ? fontSettings.fontSize : 'prose-base',
              isClient ? fontSettings.fontFamily : 'font-sans',
            )}
          >
            <p>
              Вітер приніс із гір запах дощу. Лінь Фен підвів голову від старого сувою й уперше за
              багато днів усміхнувся.
            </p>
            <p>— Отже, шлях починається тут, — прошепотів він.</p>
          </div>
        </div>
      </Tile>
    </div>
  )
}

const AppearanceSettings = () => {
  const { isSnowEnabled, toggleSnow } = useSnow()

  return (
    <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Tile className="flex flex-col gap-6 p-6 md:p-8">
        <SectionTitle
          icon={Palette}
          title="Палітра"
          description="Акцентний колір сайту. Запам'ятовується в цьому браузері."
        />
        <PalettePicker />
      </Tile>
      <Tile className="flex flex-col gap-4 p-6 md:p-8">
        <SectionTitle icon={Sparkles} title="Ефекти" />
        <ToggleRow
          id="snow-effect"
          label="Новорічний сніг"
          description="Святковий снігопад поверх сайту"
        >
          <Switch
            id="snow-effect"
            aria-describedby="snow-effect-description"
            checked={isSnowEnabled}
            onCheckedChange={toggleSnow}
          />
        </ToggleRow>
      </Tile>
    </div>
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
  const resetChanges = () => {
    if (!user) return
    setNickname(user.nickname || '')
    setIsPublic(user.isPublic ?? true)
    setNotifyOnBookComments(user.notifyOnBookComments ?? true)
  }

  if (!user) {
    return (
      <Tile className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="grid size-14 place-items-center rounded-[18px] bg-chip text-primary">
          <UserRound className="size-6" />
        </span>
        <span className="heading-display text-xl">Потрібен вхід</span>
        <span className="max-w-sm text-[15px] text-muted-foreground">
          Увійдіть в обліковий запис, щоб змінити профіль, аватарку та приватність
        </span>
        <Button asChild className="mt-1 h-11">
          <Link href={`/login?redirect=${encodeURIComponent('/settings?tab=account')}`}>
            Увійти
          </Link>
        </Button>
      </Tile>
    )
  }

  const bannerURL = getUserBannerURL(user)

  return (
    <div className="flex flex-col gap-3.5">
      {/* Профіль як його бачать інші — банер і аватар змінюються прямо тут */}
      <Tile className="overflow-hidden p-0">
        <div className="relative h-36 bg-primary/15 md:h-52">
          {bannerURL && (
            <Image
              src={bannerURL}
              alt="Банер профілю"
              fill
              sizes="1280px"
              className="object-cover"
            />
          )}
          <div className="absolute right-3 top-3 flex gap-2">
            <Button
              variant="secondary"
              className="h-10 bg-background/75 backdrop-blur-md hover:bg-background/90"
              disabled={uploadingBanner || !canPersonalize}
              onClick={() => document.getElementById('banner-upload')?.click()}
            >
              {uploadingBanner ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {bannerURL ? 'Змінити банер' : 'Додати банер'}
            </Button>
            {user.banner && (
              <Button
                variant="secondary"
                size="icon"
                className="size-10 bg-background/75 backdrop-blur-md hover:bg-background/90"
                disabled={uploadingBanner}
                onClick={handleRemoveBanner}
                aria-label="Видалити банер"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-x-5 gap-y-4 px-5 pb-5 sm:flex-row sm:flex-wrap sm:items-end md:px-7 md:pb-7">
          <div className="relative -mt-12 md:-mt-14">
            <Avatar className="size-24 rounded-[28px] ring-[5px] ring-tile md:size-28">
              <AvatarImage
                src={getUserAvatarURL(user)}
                alt={user.nickname}
                className="object-cover"
              />
              <AvatarFallback className="rounded-[28px] bg-primary font-display text-3xl font-extrabold text-primary-foreground">
                {getUserInitials(user.nickname || '')}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              aria-label="Змінити аватарку"
              disabled={uploadingAvatar || !canPersonalize}
              onClick={() => document.getElementById('avatar-upload')?.click()}
              className="absolute -bottom-1.5 -right-1.5 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-tile transition-transform cursor-pointer hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {uploadingAvatar ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
            </button>
          </div>

          <div className="flex w-full min-w-0 flex-1 flex-col gap-2 sm:w-auto">
            <span className="heading-display text-2xl break-words md:text-[30px]">
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
                      : 'bg-chip text-soft',
                  )}
                >
                  {badge.label}
                </span>
              ))}
              <span className="rounded-[10px] bg-chip px-3 py-1.5 text-[13px] font-semibold text-soft">
                з {new Date(user.createdAt).toLocaleDateString('uk-UA')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.avatar && (
              <Button
                variant="ghost"
                className="h-11"
                disabled={uploadingAvatar}
                onClick={handleRemoveAvatar}
              >
                <X className="size-4" />
                Прибрати аватарку
              </Button>
            )}
            {user.slug && (
              <Button asChild variant="secondary" className="h-11">
                <Link href={`/profile/${user.slug}`}>
                  Відкрити профіль
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 md:px-7 md:pb-7">
          {canPersonalize ? (
            <p className="text-[13px] text-muted-foreground">
              PNG, JPG, WEBP або GIF до {DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB} МБ. Аватарка —
              квадратна, банер — 1200×400.
            </p>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-chip p-4 text-sm text-soft">
              <Lock className="size-4 shrink-0 text-muted-foreground" />
              Аватарка й банер відкриваються через {minAccountAgeDays} днів після реєстрації — ще{' '}
              {daysUntilUploads} дн.
            </div>
          )}
        </div>

        <input
          id="avatar-upload"
          type="file"
          accept={USER_UPLOAD_ACCEPT}
          className="hidden"
          onChange={handleAvatarUpload}
        />
        <input
          id="banner-upload"
          type="file"
          accept={USER_UPLOAD_ACCEPT}
          className="hidden"
          onChange={handleBannerUpload}
        />
      </Tile>

      <div className="grid items-start gap-3.5 lg:grid-cols-2">
        <Tile className="flex flex-col gap-6 p-6 md:p-8">
          <SectionTitle icon={UserRound} title="Профіль" />
          <Field
            label="Нікнейм"
            description="Видно іншим читачам. Від 3 до 50 символів."
            aside={
              <span
                className={cn(
                  'text-xs tabular-nums',
                  nickname.trim().length < 3 ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {nickname.length}/50
              </span>
            }
          >
            <Input
              id="nickname"
              aria-label="Нікнейм"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && hasChanges && !isLoading) handleSave()
              }}
              placeholder="Введіть ваш нікнейм"
              maxLength={50}
              className="h-12"
            />
          </Field>
        </Tile>

        <Tile className="flex flex-col gap-4 p-6 md:p-8">
          <SectionTitle icon={ShieldCheck} title="Приватність і сповіщення" />
          <div className="flex flex-col">
            <ToggleRow
              id="public-profile"
              label="Публічний профіль"
              description={
                isPublic
                  ? 'Інші бачать ваш прогрес читання та статистику'
                  : 'Іншим видно лише нікнейм і дату реєстрації'
              }
            >
              <Switch
                id="public-profile"
                aria-describedby="public-profile-description"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </ToggleRow>

            {canOwnBooks && (
              <ToggleRow
                id="notify-book-comments"
                label="Коментарі до ваших книг"
                description="Сповіщати, коли хтось коментує розділ вашої книги"
              >
                <Switch
                  id="notify-book-comments"
                  aria-describedby="notify-book-comments-description"
                  checked={notifyOnBookComments}
                  onCheckedChange={setNotifyOnBookComments}
                />
              </ToggleRow>
            )}
          </div>
        </Tile>
      </div>

      {/* Плаваюча панель збереження — з'являється лише коли є зміни */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed inset-x-3 bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] z-50 mx-auto flex max-w-[560px] items-center gap-2 rounded-[22px] bg-chip p-2 pl-5 shadow-float md:bottom-6"
          >
            <span className="flex-1 text-sm font-semibold">Є незбережені зміни</span>
            <Button variant="ghost" className="h-11" onClick={resetChanges} disabled={isLoading}>
              Скасувати
            </Button>
            <Button className="h-11" onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Зберегти
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SETTINGS_PAGES = [
  { id: 'reading', button: 'Читання', icon: BookOpen, component: ReadingSettings },
  { id: 'appearance', button: 'Вигляд', icon: Palette, component: AppearanceSettings },
  { id: 'account', button: 'Акаунт', icon: UserRound, component: AccountSettings },
]

const SettingsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromQuery = searchParams.get('tab')

  const initialPage = SETTINGS_PAGES.find((p) => p.id === tabFromQuery)?.id || SETTINGS_PAGES[0].id
  const [page, setPage] = useState(initialPage)

  const ActiveComponent = SETTINGS_PAGES.find((setting) => setting.id === page)?.component

  const handlePageChange = (newPage: string) => {
    setPage(newPage)
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('tab', newPage)
    router.replace(currentUrl.pathname + currentUrl.search, { scroll: false })
  }

  // Синхронізація з ?tab= (наприклад, перехід «Назад»)
  useEffect(() => {
    if (tabFromQuery && SETTINGS_PAGES.find((p) => p.id === tabFromQuery)) {
      setPage(tabFromQuery)
    }
  }, [tabFromQuery])

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="heading-display text-[32px] md:text-[44px]">Налаштування</h1>
        <nav
          aria-label="Розділи налаштувань"
          className="inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-2xl bg-tile p-[5px] [scrollbar-width:none] md:self-auto"
        >
          {SETTINGS_PAGES.map((setting) => {
            const Icon = setting.icon
            const active = page === setting.id
            return (
              <button
                key={setting.id}
                type="button"
                onClick={() => handlePageChange(setting.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-xl px-4 text-[15px] font-bold transition-colors cursor-pointer',
                  active ? 'bg-primary text-primary-foreground' : 'text-soft hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {setting.button}
              </button>
            )
          })}
        </nav>
      </div>
      <motion.div
        key={page}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {ActiveComponent && <ActiveComponent />}
      </motion.div>
    </div>
  )
}

export default SettingsPage
