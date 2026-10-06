import { loadFont } from '@remotion/fonts'
import { staticFile } from 'remotion'

// Ті самі токени, що й у src/app/(frontend)/styles.css
export type Palette = {
  id: string
  label: string
  bg: string
  tile: string
  chip: string
  acc: string
  ink: string
  muted: string
  soft: string
  fg: string
}

const fg = '#f2f2f2'

export const palettes: Palette[] = [
  { id: 'tangerine', label: 'Мандарин', bg: '#0d0b0a', tile: '#1a1614', chip: '#26201d', acc: '#ff8a3d', ink: '#140c06', muted: '#a39a94', soft: '#d6cec8', fg },
  { id: 'violet', label: 'Фіалка', bg: '#0b0a10', tile: '#17151f', chip: '#221f2d', acc: '#b69cff', ink: '#120c24', muted: '#9c97ab', soft: '#d3cfe0', fg },
  { id: 'mint', label: "М'ята", bg: '#090c0c', tile: '#141a19', chip: '#1e2625', acc: '#5eead4', ink: '#04201b', muted: '#93a29f', soft: '#cbd9d6', fg },
  { id: 'rose', label: 'Троянда', bg: '#0d0a0b', tile: '#1b1517', chip: '#272023', acc: '#ff8fb1', ink: '#2a0a15', muted: '#a8999e', soft: '#dccdd2', fg },
  { id: 'lime', label: 'Лайм', bg: '#0b0b0d', tile: '#19191b', chip: '#252528', acc: '#d4f53c', ink: '#111111', muted: '#a3a3a8', soft: '#d0d0d4', fg },
  { id: 'peach', label: 'Персик', bg: '#0d0b0a', tile: '#1a1715', chip: '#26221f', acc: '#ffc59e', ink: '#2a160a', muted: '#a59c95', soft: '#d9d0c9', fg },
]

export const tangerine = palettes[0]

// Фони тексту читалки: накладаються поверх палітри
export const readerBgs = {
  theme: null,
  sepia: { bg: '#f4ecd8', tile: '#eadfc5', chip: '#e0d3b4', fg: '#3b2f22', muted: '#7a6a55', soft: '#4a3c2c' },
  light: { bg: '#f7f5f2', tile: '#ece8e3', chip: '#e2ddd7', fg: '#1c1917', muted: '#6b625c', soft: '#3d3631' },
} as const

export const DISPLAY = 'Unbounded'
export const SANS = 'Onest'
export const READER = '"Segoe UI", system-ui, sans-serif'

let fontsPromise: Promise<unknown> | null = null
export const loadFonts = () => {
  fontsPromise ??= Promise.all([
    loadFont({ family: DISPLAY, url: staticFile('fonts/Unbounded-ExtraBold.ttf'), weight: '800' }),
    loadFont({ family: SANS, url: staticFile('fonts/Onest-Medium.ttf'), weight: '500' }),
    loadFont({ family: SANS, url: staticFile('fonts/Onest-Bold.ttf'), weight: '700' }),
  ])
  return fontsPromise
}

export const FPS = 30
