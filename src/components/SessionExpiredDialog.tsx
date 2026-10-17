'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/providers/auth'
import { markSession, takeSessionMark } from '@/providers/auth/session-marker'

// На цих сторінках людина й так входить — повідомлення там зайве.
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password']

/**
 * Один раз повідомляє, що сесія завершилась, якщо людина була залогінена, а тепер
 * сайт бачить її гостем. Читати й зберігати прогрес локально можна й без акаунта,
 * тож без цього вихід лишається непоміченим.
 *
 * Дві ознаки: позначка в localStorage (сесія спливла після довгої перерви — куки
 * вже нема) або кука, яку сервер більше не приймає (див. `/api/users/stale-session`).
 * Перевіряється лише перший результат `/me`, тож звичайний вихід діалог не викликає.
 */
export const SessionExpiredDialog = () => {
  const { user } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const checked = useRef(false)
  const userRef = useRef(user)

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    // Ще завантажується
    if (user === undefined) return

    if (user) {
      markSession()
      checked.current = true
      return
    }

    if (checked.current) return
    checked.current = true

    const hadSession = takeSessionMark()
    const onAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page))

    // Запит робимо завжди: він ще й прибирає мертву куку.
    void fetch('/api/users/stale-session', { method: 'POST', credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data: null | { stale?: boolean }) => {
        // Поки чекали відповідь, людина могла вже увійти
        if (userRef.current) return
        if (!onAuthPage && (hadSession || data?.stale)) setOpen(true)
      })
  }, [user, pathname])

  // Якщо тим часом увійшли — діалог ховається сам
  return (
    <AlertDialog open={open && !user} onOpenChange={setOpen}>
      {/* Над посторінковою читалкою (z-[200]) та її панелями (до z-[300]) */}
      <AlertDialogContent className="z-[400]" overlayClassName="z-[390]">
        <AlertDialogHeader>
          <AlertDialogTitle className="heading-display text-xl">Сесія завершилась</AlertDialogTitle>
          <AlertDialogDescription className="text-soft text-[15px]">
            Ви вийшли з акаунта — так буває після довгої перерви або оновлення сайту. Читати можна й
            далі, але прогрес тепер зберігається лише на цьому пристрої і не синхронізується з
            акаунтом. Якщо очистити дані браузера, його буде втрачено. Увійдіть знову, щоб нічого не
            загубити.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 rounded-xl">Пізніше</AlertDialogCancel>
          <AlertDialogAction asChild className="h-11 rounded-xl">
            <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Увійти</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
