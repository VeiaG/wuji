'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface LastReadPage {
  slug: string
  page: string
  timestamp: number
  title?: string // опціонально для відображення
}

interface LastReadSettings {
  autoResume: boolean
  maxAge: number // в днях, після скільки не показувати стару сторінку
}

const STORAGE_KEYS = {
  LAST_PAGE: 'last-read-page',
  SETTINGS: 'last-read-settings',
  SESSION_VISITED: 'session-visited',
  INITIAL_PATH: 'initial-path',
} as const

const DEFAULT_SETTINGS: LastReadSettings = {
  autoResume: true,
  maxAge: 7, // 7 днів
}

export const useLastReadPage = () => {
  const router = useRouter()
  const [settings, setSettings] = useState<LastReadSettings>(DEFAULT_SETTINGS)
  const [lastPage, setLastPage] = useState<LastReadPage | null>(null)

  // Завантаження налаштувань при ініціалізації
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) })
      } catch (error) {
        console.warn('Failed to parse last read settings:', error)
      }
    }

    const savedLastPage = localStorage.getItem(STORAGE_KEYS.LAST_PAGE)
    if (savedLastPage) {
      try {
        setLastPage(JSON.parse(savedLastPage))
      } catch (error) {
        console.warn('Failed to parse last read page:', error)
      }
    }
  }, [])

  // Збереження останньої сторінки
  const saveLastPage = useCallback((slug: string, page: string, title?: string) => {
    if (typeof window === 'undefined') return

    const lastPageData: LastReadPage = {
      slug,
      page,
      timestamp: Date.now(),
      title,
    }

    localStorage.setItem(STORAGE_KEYS.LAST_PAGE, JSON.stringify(lastPageData))
    setLastPage(lastPageData)
  }, [])

  // Оновлення налаштувань
  const updateSettings = useCallback(
    (newSettings: Partial<LastReadSettings>) => {
      if (typeof window === 'undefined') return

      const updatedSettings = { ...settings, ...newSettings }
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings))
      setSettings(updatedSettings)
    },
    [settings],
  )

  // Перевірка чи сторінка застара
  const isPageValid = useCallback(
    (page: LastReadPage | null): boolean => {
      if (!page) return false

      const daysDiff = (Date.now() - page.timestamp) / (1000 * 60 * 60 * 24)
      return daysDiff <= settings.maxAge
    },
    [settings.maxAge],
  )

  // Функція для відстеження початкового шляху сесії
  const trackInitialPath = useCallback((path: string) => {
    if (typeof window === 'undefined') return

    const initialPath = sessionStorage.getItem(STORAGE_KEYS.INITIAL_PATH)
    if (!initialPath) {
      sessionStorage.setItem(STORAGE_KEYS.INITIAL_PATH, path)
      if (process.env.NODE_ENV === 'development') {
        console.log('🏁 Tracked initial path:', path)
      }
    }
  }, [])

  // Автоматичний перехід на останню сторінку
  const handleAutoResume = useCallback((currentPath: string = '/') => {
    if (typeof window === 'undefined') return false

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 handleAutoResume called:', { currentPath })
    }

    // Перевіряємо чи це перший візит в сесії
    const hasVisited = sessionStorage.getItem(STORAGE_KEYS.SESSION_VISITED)
    if (hasVisited) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Already visited in this session')
      }
      return false
    }

    // Отримуємо початковий шлях сесії
    const initialPath = sessionStorage.getItem(STORAGE_KEYS.INITIAL_PATH)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📍 Initial path check:', { initialPath, currentPath })
    }

    // Спрацьовує тільки якщо користувач почав сесію з головної сторінки
    if (initialPath !== '/') {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Not started from homepage, skipping auto-resume')
      }
      return false
    }

    // Перевіряємо налаштування та валідність останньої сторінки
    if (!settings.autoResume || !lastPage || !isPageValid(lastPage)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Settings or page invalid:', { 
          autoResume: settings.autoResume, 
          hasLastPage: !!lastPage, 
          isValid: lastPage ? isPageValid(lastPage) : false 
        })
      }
      return false
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Auto-resuming to:', lastPage)
    }

    // Позначаємо що відвідали в цій сесії
    sessionStorage.setItem(STORAGE_KEYS.SESSION_VISITED, 'true')

    // Перенаправляємо на останню сторінку
    const lastPageUrl = `/novel/${lastPage.slug}/${lastPage.page}`
    router.replace(lastPageUrl)
    return true
  }, [settings.autoResume, lastPage, isPageValid, router])

  // Очищення збереженої останньої сторінки
  const clearLastPage = useCallback(() => {
    if (typeof window === 'undefined') return

    localStorage.removeItem(STORAGE_KEYS.LAST_PAGE)
    setLastPage(null)
  }, [])

  // Перевірка чи поточна сторінка - сторінка читання
  const isReadingPage = useCallback((path: string): boolean => {
    return /^\/novel\/[^\/]+\/[^\/]+$/.test(path)
  }, [])

  return {
    settings,
    lastPage: isPageValid(lastPage) ? lastPage : null,
    saveLastPage,
    updateSettings,
    handleAutoResume,
    trackInitialPath,
    clearLastPage,
    isReadingPage,
  }
}
