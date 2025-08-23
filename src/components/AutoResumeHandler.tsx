'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLastReadPageContext } from './LastReadPageProvider'

export const AutoResumeHandler = () => {
  const pathname = usePathname()
  const { handleAutoResume } = useLastReadPageContext()

  useEffect(() => {
    // Спрацьовує тільки на головній сторінці
    if (pathname === '/') {
      handleAutoResume()
    }
  }, [pathname, handleAutoResume])

  return null // Цей компонент не рендерить нічого
}
