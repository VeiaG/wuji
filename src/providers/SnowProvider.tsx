'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Snowfall to avoid SSR issues
const Snowfall = dynamic(() => import('react-snowfall'), { ssr: false })

type SnowContextType = {
  isSnowEnabled: boolean
  toggleSnow: () => void
}

const SnowContext = createContext<SnowContextType | undefined>(undefined)

export const useSnow = () => {
  const context = useContext(SnowContext)
  if (!context) {
    throw new Error('useSnow must be used within SnowProvider')
  }
  return context
}

export const SnowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSnowEnabled, setIsSnowEnabled] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load from localStorage on mount
    const stored = localStorage.getItem('snowEnabled')
    if (stored !== null) {
      setIsSnowEnabled(stored === 'true')
    }
  }, [])

  const toggleSnow = () => {
    setIsSnowEnabled((prev) => {
      const newValue = !prev
      // Save to localStorage
      localStorage.setItem('snowEnabled', String(newValue))
      return newValue
    })
  }

  // Don't render until client-side to avoid hydration mismatch
  if (!isClient) {
    return <>{children}</>
  }

  return (
    <SnowContext.Provider value={{ isSnowEnabled, toggleSnow }}>
      {/* Render snow effect if enabled */}
      {isSnowEnabled && (
        <Snowfall
          color="#dee4fd"
          snowflakeCount={150}
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      )}
      {children}
    </SnowContext.Provider>
  )
}
