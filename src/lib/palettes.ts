// Акцентні палітри сайту. Значення кольорів живуть у styles.css ([data-palette=...]),
// тут лише список для провайдера та пікера в налаштуваннях.
export const palettes = [
  { id: 'tangerine', label: 'Мандарин', bg: '#0d0b0a', tile: '#1a1614', accent: '#ff8a3d' },
  { id: 'violet', label: 'Фіалка', bg: '#0b0a10', tile: '#17151f', accent: '#b69cff' },
  { id: 'mint', label: "М'ята", bg: '#090c0c', tile: '#141a19', accent: '#5eead4' },
  { id: 'rose', label: 'Троянда', bg: '#0d0a0b', tile: '#1b1517', accent: '#ff8fb1' },
  { id: 'lime', label: 'Лайм', bg: '#0b0b0d', tile: '#19191b', accent: '#d4f53c' },
  { id: 'peach', label: 'Персик', bg: '#0d0b0a', tile: '#1a1715', accent: '#ffc59e' },
] as const

export type PaletteId = (typeof palettes)[number]['id']

export const DEFAULT_PALETTE: PaletteId = 'tangerine'
export const PALETTE_STORAGE_KEY = 'palette'
