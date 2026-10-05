'use client'

import { Minus, Plus } from 'lucide-react'
import {
  fontFamilyOptions,
  readerBackgroundOptions,
  readingModeOptions,
  sizeOptions,
  type Settings,
} from '@/globals/settings'
import { cn } from '@/lib/utils'

const segment =
  'min-h-10 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors cursor-pointer'

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
    {children}
  </div>
)

const bgSwatch: Record<string, string> = {
  theme: 'bg-background',
  light: 'bg-[#f7f5f2] text-[#1c1917]',
  sepia: 'bg-[#f4ecd8] text-[#3b2f22]',
}

// Вміст поповера «Aa»: розмір, шрифт, фон тексту, режим
export function ReaderSettings({
  settings,
  onChange,
  showMode = true,
}: {
  settings: Settings
  onChange: (partial: Partial<Settings>) => void
  showMode?: boolean
}) {
  const sizeIndex = Math.max(
    0,
    sizeOptions.findIndex((o) => o.value === settings.fontSize),
  )
  const setSize = (index: number) => {
    const next = sizeOptions[Math.min(sizeOptions.length - 1, Math.max(0, index))]
    if (next) onChange({ fontSize: next.value })
  }

  return (
    <div className="flex w-[min(320px,calc(100vw-32px))] flex-col gap-4">
      <Row label="Розмір тексту">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSize(sizeIndex - 1)}
            disabled={sizeIndex === 0}
            aria-label="Зменшити"
            className="grid size-11 place-items-center rounded-xl bg-chip transition-colors hover:bg-chip/70 disabled:opacity-40 cursor-pointer"
          >
            <Minus className="size-4" />
          </button>
          <span className="flex-1 text-center text-sm font-semibold">
            {sizeOptions[sizeIndex]?.label}
          </span>
          <button
            type="button"
            onClick={() => setSize(sizeIndex + 1)}
            disabled={sizeIndex === sizeOptions.length - 1}
            aria-label="Збільшити"
            className="grid size-11 place-items-center rounded-xl bg-chip transition-colors hover:bg-chip/70 disabled:opacity-40 cursor-pointer"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </Row>

      <Row label="Шрифт">
        <div className="flex gap-1 rounded-2xl bg-background p-1">
          {fontFamilyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.fontFamily === option.value}
              onClick={() => onChange({ fontFamily: option.value })}
              className={cn(
                segment,
                option.value === 'font-sans' ? 'font-[family-name:var(--font-reader-sans)]' : option.value,
                settings.fontFamily === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-soft hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Фон тексту">
        <div className="grid grid-cols-3 gap-2">
          {readerBackgroundOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.readerBackground === option.value}
              onClick={() => onChange({ readerBackground: option.value })}
              className={cn(
                'flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold ring-1 ring-border transition cursor-pointer',
                bgSwatch[option.value],
                settings.readerBackground === option.value && 'ring-2 ring-primary',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Row>

      {showMode && (
        <Row label="Режим">
          <div className="flex gap-1 rounded-2xl bg-background p-1">
            {readingModeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={settings.readingMode === option.value}
                onClick={() => onChange({ readingMode: option.value as Settings['readingMode'] })}
                className={cn(
                  segment,
                  settings.readingMode === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-soft hover:text-foreground',
                )}
              >
                {option.value === 'scroll' ? 'Стрічка' : 'Сторінки'}
              </button>
            ))}
          </div>
        </Row>
      )}
    </div>
  )
}
