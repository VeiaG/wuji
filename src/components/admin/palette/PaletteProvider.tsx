'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from 'react'
import { usePreferences } from '@payloadcms/ui'
import {
  DEFAULT_PALETTE,
  PALETTE_PREFERENCE_KEY,
  PALETTE_STORAGE_KEY,
  palettes,
  type PaletteId,
} from '@/lib/palettes'

type PaletteContextValue = {
  palette: PaletteId
  setPalette: (palette: PaletteId) => void
}

const PaletteContext = createContext<PaletteContextValue>({
  palette: DEFAULT_PALETTE,
  setPalette: () => {},
})

// подія для змін у цій же вкладці (`storage` приходить лише з інших вкладок)
const LOCAL_CHANGE_EVENT = 'wuji:palette-change'

// запасне значення, якщо localStorage недоступний (приватний режим, блокування)
let memoryPalette: PaletteId | null = null

const isPaletteId = (value: unknown): value is PaletteId =>
  typeof value === 'string' && palettes.some((p) => p.id === value)

const readStorage = (): PaletteId | null => {
  try {
    const stored = window.localStorage.getItem(PALETTE_STORAGE_KEY)
    return isPaletteId(stored) ? stored : null
  } catch {
    return null
  }
}

// палітра, яку сервер поставив на <html> з payload-preferences (layout адмінки)
const readServerPalette = (): PaletteId | null => {
  const value = document.documentElement.dataset.palette
  return isPaletteId(value) ? value : null
}

/**
 * Пріоритет: localStorage (останній вибір на цьому пристрої — спільний із сайтом),
 * потім палітра з налаштувань, яку сервер уже поставив на <html>, потім дефолт.
 */
const getSnapshot = (): PaletteId =>
  memoryPalette ?? readStorage() ?? readServerPalette() ?? DEFAULT_PALETTE

const subscribe = (onChange: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === PALETTE_STORAGE_KEY) {
      memoryPalette = null
      onChange()
    }
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(LOCAL_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(LOCAL_CHANGE_EVENT, onChange)
  }
}

/**
 * Акцентна палітра сайту в адмінці (`admin.components.providers`).
 *
 * - Сервер (src/app/(payload)/layout.tsx → getAdminPalette) ставить `data-palette` на <html>
 *   з payload-preferences — перший кадр одразу у вибраній палітрі.
 * - Клієнт читає той самий localStorage-ключ, що й next-themes на сайті (`palette`): вибір
 *   спільний для сайту й адмінки, вкладки синхронізуються подією `storage`.
 * - Якщо на пристрої палітра інша, ніж у налаштуваннях (змінили на сайті), — вона перемагає
 *   і записується в налаштування, щоб наступного разу сервер віддав уже її.
 */
export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const palette = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_PALETTE)
  const { setPreference } = usePreferences()
  // що зараз лежить у налаштуваннях (наскільки ми знаємо) — щоб не писати зайвий раз
  const savedPreference = useRef<PaletteId | null>(null)

  // Ефекти беруть справжнє значення з getSnapshot(), а не `palette`: на гідрації
  // useSyncExternalStore спершу віддає серверний знімок (дефолт), і без цього ми б на мить
  // поставили мандарин поверх серверної палітри й записали його в налаштування.
  useLayoutEffect(() => {
    if (savedPreference.current === null) savedPreference.current = readServerPalette()
    document.documentElement.dataset.palette = getSnapshot()
  }, [palette])

  useEffect(() => {
    const current = getSnapshot()
    if (savedPreference.current === current) return
    savedPreference.current = current
    // сайт читає localStorage — тримаємо його в синхроні з адмінкою
    try {
      if (readStorage() !== current) window.localStorage.setItem(PALETTE_STORAGE_KEY, current)
    } catch {
      // сховище недоступне
    }
    void setPreference(PALETTE_PREFERENCE_KEY, current).catch(() => {})
  }, [palette, setPreference])

  const setPalette = useCallback((next: PaletteId) => {
    memoryPalette = next
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, next)
      memoryPalette = null
    } catch {
      // сховище недоступне — діє memoryPalette до перезавантаження
    }
    window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT))
  }, [])

  return (
    <PaletteContext.Provider value={{ palette, setPalette }}>{children}</PaletteContext.Provider>
  )
}

export const usePalette = () => useContext(PaletteContext)
