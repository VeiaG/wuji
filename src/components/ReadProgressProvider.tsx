'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useReadProgress, UseReadProgressReturn } from '@/hooks/useReadProgress'
import { useAuth } from '@/providers/auth'

const ReadProgressContext = createContext<UseReadProgressReturn | undefined>(undefined)

export function ReadProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const readProgress = useReadProgress(user?.id)

  return <ReadProgressContext.Provider value={readProgress}>{children}</ReadProgressContext.Provider>
}

export function useReadProgressContext() {
  const context = useContext(ReadProgressContext)
  if (!context) {
    throw new Error('useReadProgressContext must be used within ReadProgressProvider')
  }
  return context
}
