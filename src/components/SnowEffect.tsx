'use client'

import React from 'react'
import Snowfall from 'react-snowfall'
import { useSnow } from '@/providers/SnowProvider'

const SnowEffect = () => {
  const { isSnowEnabled } = useSnow()

  if (!isSnowEnabled) {
    return null
  }

  return (
    <Snowfall
      color="#dee4fd"
      snowflakeCount={30}
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    />
  )
}

export default SnowEffect
