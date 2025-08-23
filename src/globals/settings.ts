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

export interface Settings {
  fontSize: string
  fontFamily: string
}
export const getInitialSettings = (): Settings => {
  if (typeof window === 'undefined')
    return {
      fontSize: 'prose-base',
      fontFamily: 'font-sans',
    }

  try {
    const stored = localStorage.getItem('settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        fontSize: parsed.fontSize || 'prose-base',
        fontFamily: parsed.fontFamily || 'font-sans',
      }
    }
  } catch (e) {
    console.error('Failed to parse settings', e)
  }

  return {
    fontSize: 'prose-base',
    fontFamily: 'font-sans',
  }
}
