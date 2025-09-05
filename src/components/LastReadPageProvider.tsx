'use client'

import { createContext, useContext, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLastReadPage } from '@/hooks/useLastReadPage'

const LastReadPageContext = createContext<ReturnType<typeof useLastReadPage> | null>(null)

export const useLastReadPageContext = () => {
  const context = useContext(LastReadPageContext)
  if (!context) {
    throw new Error('useLastReadPageContext must be used within LastReadPageProvider')
  }
  return context
}

interface LastReadPageProviderProps {
  children: React.ReactNode
}

export const LastReadPageProvider = ({ children }: LastReadPageProviderProps) => {
  const pathname = usePathname()
  const lastReadHook = useLastReadPage()

  // Відстежування початкового шляху сесії
  useEffect(() => {
    lastReadHook.trackInitialPath(pathname)
    //eslint-disable-next-line
  }, [pathname, lastReadHook.trackInitialPath])

  // Автоматичне збереження останньої сторінки на сторінках читання
  useEffect(() => {
    if (lastReadHook.isReadingPage(pathname)) {
      const pathParts = pathname.split('/')
      const slug = pathParts[2]
      const page = pathParts[3]

      if (slug && page) {
        // Затримка для уникнення зайвих збережень при швидкому переході
        const timeoutId = setTimeout(() => {
          lastReadHook.saveLastPage(slug, page)
        }, 1000)

        return () => clearTimeout(timeoutId)
      }
    }
    //eslint-disable-next-line
  }, [pathname, lastReadHook.saveLastPage, lastReadHook.isReadingPage])

  return (
    <LastReadPageContext.Provider value={lastReadHook}>{children}</LastReadPageContext.Provider>
  )
}
