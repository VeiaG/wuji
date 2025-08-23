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

  // Автоматичний перехід на останню сторінку
  const handleAutoResume = useCallback(() => {
    if (typeof window === 'undefined') return false

    // Перевіряємо чи це перший візит в сесії
    const hasVisited = sessionStorage.getItem(STORAGE_KEYS.SESSION_VISITED)
    if (hasVisited) return false

    // Перевіряємо налаштування та валідність останньої сторінки
    if (!settings.autoResume || !lastPage || !isPageValid(lastPage)) {
      return false
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
    clearLastPage,
    isReadingPage,
  }
}
