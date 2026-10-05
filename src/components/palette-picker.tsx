'use client'

import { Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { palettes } from '@/lib/palettes'
import { cn } from '@/lib/utils'

const PalettePicker = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Вибрана палітра відома лише на клієнті — до монтування нічого не підсвічуємо
  useEffect(() => setMounted(true), [])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Палітра</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {palettes.map((palette) => {
          const isSelected = mounted && theme === palette.id

          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => setTheme(palette.id)}
              aria-pressed={isSelected}
              className={cn(
                'group flex flex-col gap-3 rounded-tile-sm p-3 text-left transition-colors bg-chip hover:bg-chip/70 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected && 'ring-2 ring-primary',
              )}
            >
              <span
                className="relative flex h-16 w-full items-end gap-1.5 overflow-hidden rounded-xl p-2"
                style={{ background: palette.bg }}
              >
                <span className="h-full w-1/2 rounded-lg" style={{ background: palette.tile }} />
                <span className="flex h-full w-1/2 flex-col gap-1.5">
                  <span className="flex-1 rounded-lg" style={{ background: palette.accent }} />
                  <span className="flex-1 rounded-lg" style={{ background: palette.tile }} />
                </span>
              </span>
              <span className="flex items-center justify-between gap-2 px-1">
                <span className="text-sm font-semibold">{palette.label}</span>
                {isSelected && <Check className="size-4 text-primary" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PalettePicker
