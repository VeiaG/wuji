'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useReadProgressContext } from './ReadProgressProvider'

export const AutoResumeHandler = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { getLastRead } = useReadProgressContext()
  const [hasResumed, setHasResumed] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧭 AutoResumeHandler pathname changed:', pathname)
    }

    // Спрацьовує тільки на головній сторінці
    if (pathname === '/' && !hasResumed) {
      const handleResume = async () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🏠 On homepage, checking for last read')
        }

        // Check if auto-resume is enabled
        const settings = localStorage.getItem('last-read-settings')
        const autoResume = settings ? JSON.parse(settings).autoResume : true

        if (!autoResume) {
          if (process.env.NODE_ENV === 'development') {
            console.log('⏸️ Auto-resume disabled in settings')
          }
          return
        }

        // Check if we already resumed in this session
        const sessionVisited = sessionStorage.getItem('session-visited')
        if (sessionVisited) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Already resumed in this session')
          }
          return
        }

        const lastRead = await getLastRead()
        if (lastRead) {
          // Check if not too old (7 days by default)
          const maxAge = settings ? JSON.parse(settings).maxAge || 7 : 7
          const ageInDays = (Date.now() - lastRead.timestamp) / (1000 * 60 * 60 * 24)

          if (ageInDays <= maxAge) {
            if (process.env.NODE_ENV === 'development') {
              console.log('📖 Resuming to:', lastRead.bookSlug, lastRead.chapter)
            }
            sessionStorage.setItem('session-visited', 'true')
            setHasResumed(true)
            router.push(`/novel/${lastRead.bookSlug}/${lastRead.chapter}`)
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('⏰ Last read page is too old:', ageInDays, 'days')
            }
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('📭 No last read page found')
          }
        }
      }

      handleResume()
    } else if (pathname !== '/') {
      if (process.env.NODE_ENV === 'development') {
        console.log('📄 Not on homepage, skipping auto-resume')
      }
    }
  }, [pathname, getLastRead, router, hasResumed])

  return null // Цей компонент не рендерить нічого
}
