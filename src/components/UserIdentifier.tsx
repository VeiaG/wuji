'use client'

import { useAuth } from '@/providers/auth'
import { useEffect } from 'react'

export function UmamiUserIdentifier() {
  const { user } = useAuth()

  useEffect(() => {
    // Перевіряємо, чи існує об'єкт користувача та чи завантажився скрипт umami
    // @ts-expect-error umami is a script loaded in the head, not a react library
    if (user && typeof window !== 'undefined' && window.umami) {
      // @ts-expect-error umami is a script loaded in the head
      window.umami.identify({
        name: user.nickname,
        email: user.email,
        userId: user.id,
      })
    }
  }, [user]) // Цей ефект спрацює щоразу, коли `user` зміниться

  return null // Цей компонент не рендерить нічого
}
