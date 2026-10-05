export const sizeOptions = [
  { label: 'Малий', value: 'prose-sm' },
  { label: 'Середній', value: 'prose-base' },
  { label: 'Великий', value: 'prose-lg' },
  { label: 'Дуже великий', value: 'prose-xl' },
  { label: 'Величезний', value: 'prose-2xl' },
]
export const fontFamilyOptions = [
  { label: 'Санс', value: 'font-sans' },
  { label: 'Шериф', value: 'font-serif' },
  { label: 'Моно', value: 'font-mono' },
]
export const readingModeOptions: { label: string; value: string; beta?: boolean }[] = [
  { label: 'Скрол', value: 'scroll' },
  { label: 'По сторінках', value: 'paginated', beta: true },
]
// Фон тексту в читалці. Сайт лишається темним, світлі варіанти — лише для тексту
export const readerBackgroundOptions = [
  { label: 'Тема', value: 'theme' },
  { label: 'Світлий', value: 'light' },
  { label: 'Сепія', value: 'sepia' },
] as const

export type ReaderBackground = (typeof readerBackgroundOptions)[number]['value']

export interface Settings {
  fontSize: string
  fontFamily: string
  readingMode: 'scroll' | 'paginated'
  readerBackground: ReaderBackground
}

export const defaultSettings: Settings = {
  fontSize: 'prose-base',
  fontFamily: 'font-sans',
  readingMode: 'scroll',
  readerBackground: 'theme',
}

export const getInitialSettings = (): Settings => {
  if (typeof window === 'undefined') return defaultSettings

  try {
    const stored = localStorage.getItem('settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        fontSize: parsed.fontSize || defaultSettings.fontSize,
        fontFamily: parsed.fontFamily || defaultSettings.fontFamily,
        readingMode: parsed.readingMode || defaultSettings.readingMode,
        readerBackground: readerBackgroundOptions.some((o) => o.value === parsed.readerBackground)
          ? parsed.readerBackground
          : defaultSettings.readerBackground,
      }
    }
  } catch (e) {
    console.error('Failed to parse settings', e)
  }

  return defaultSettings
}
