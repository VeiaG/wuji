'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useNotifications, UseNotificationsReturn } from '@/hooks/useNotifications'
import { useAuth } from '@/providers/auth'

const NotificationsContext = createContext<UseNotificationsReturn | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const value = useNotifications(user?.id)

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotificationsContext must be used within NotificationsProvider')
  }
  return context
}
