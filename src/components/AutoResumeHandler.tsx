'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLastReadPageContext } from './LastReadPageProvider'

export const AutoResumeHandler = () => {
  const pathname = usePathname()
  const { handleAutoResume } = useLastReadPageContext()

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧭 AutoResumeHandler pathname changed:', pathname)
    }
    
    // Спрацьовує тільки на головній сторінці
    if (pathname === '/') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🏠 On homepage, calling handleAutoResume')
      }
      handleAutoResume(pathname)
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('📄 Not on homepage, skipping auto-resume')
      }
    }
  }, [pathname, handleAutoResume])

  return null // Цей компонент не рендерить нічого
}
