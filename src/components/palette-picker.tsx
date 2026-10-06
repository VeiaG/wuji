'use client'

import { Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { palettes } from '@/lib/palettes'
import { cn } from '@/lib/utils'

// Вибір акцентної палітри: кожна картка — мініатюра сайту в цих кольорах
const PalettePicker = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Вибрана палітра відома лише на клієнті — до монтування нічого не підсвічуємо
  useEffect(() => setMounted(true), [])

  return (
    <div role="radiogroup" aria-label="Палітра" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {palettes.map((palette) => {
        const isSelected = mounted && theme === palette.id

        return (
          <button
            key={palette.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(palette.id)}
            className={cn(
              'group flex flex-col gap-2.5 rounded-tile-sm bg-chip p-2.5 text-left outline-none transition-[background-color,box-shadow] cursor-pointer hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring',
              isSelected && 'ring-2 ring-primary',
            )}
          >
            {/* Мініатюра: лого, плитка з обкладинкою та кнопкою, прогрес */}
            <span
              className="flex aspect-[16/10] w-full flex-col gap-1.5 overflow-hidden rounded-[14px] p-2"
              style={{ background: palette.bg }}
              aria-hidden
            >
              <span className="flex items-center gap-1 font-display text-[11px] font-extrabold tracking-[-0.04em]">
                <span style={{ color: '#f5efe9' }}>ву</span>
                <span className="-ml-1" style={{ color: palette.accent }}>
                  чи
                </span>
              </span>
              <span className="flex flex-1 gap-1.5">
                <span
                  className="flex flex-1 flex-col justify-end gap-1 rounded-lg p-1.5"
                  style={{ background: palette.tile }}
                >
                  <span className="h-1 w-3/4 rounded-full bg-white/50" />
                  <span className="h-1 w-1/2 rounded-full bg-white/25" />
                  <span className="mt-1 h-2.5 w-8 rounded" style={{ background: palette.accent }} />
                </span>
                <span
                  className="w-[30%] rounded-lg transition-transform duration-300 group-hover:-rotate-3"
                  style={{
                    background: `linear-gradient(160deg, ${palette.accent}, ${palette.tile})`,
                  }}
                />
              </span>
              <span
                className="h-1 overflow-hidden rounded-full"
                style={{ background: palette.tile }}
              >
                <span
                  className="block h-full w-2/3 rounded-full"
                  style={{ background: palette.accent }}
                />
              </span>
            </span>
            <span className="flex items-center justify-between gap-2 px-1 pb-0.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="size-2.5 rounded-full" style={{ background: palette.accent }} />
                {palette.label}
              </span>
              {isSelected && <Check className="size-4 text-primary" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default PalettePicker
