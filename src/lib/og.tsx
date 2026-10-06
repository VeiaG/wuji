import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Спільне для OG-зображень (1200×630): палітра tangerine, шрифти сайту, логотип
export const OG_SIZE = { width: 1200, height: 630 }

export const og = {
  bg: '#0d0b0a',
  tile: '#1a1614',
  chip: '#26201d',
  accent: '#ff8a3d',
  ink: '#140c06',
  fg: '#f5efe9',
  soft: '#d6cec8',
  muted: '#a39a94',
}

const fontFile = (name: string) => readFile(join(process.cwd(), 'src/fonts', name))

// Satori не вміє woff2/variable і з кількох файлів з однаковою назвою бере лише перший,
// тож тримаємо повні статичні TTF (кирилиця + латиниця) у src/fonts
export const loadOgFonts = async () => {
  const [unbounded, onestMedium, onestBold] = await Promise.all([
    fontFile('Unbounded-ExtraBold.ttf'),
    fontFile('Onest-Medium.ttf'),
    fontFile('Onest-Bold.ttf'),
  ])
  return [
    { name: 'Unbounded', data: unbounded, weight: 800 as const, style: 'normal' as const },
    { name: 'Onest', data: onestMedium, weight: 500 as const, style: 'normal' as const },
    { name: 'Onest', data: onestBold, weight: 700 as const, style: 'normal' as const },
  ]
}

/** Логотип «ву» + «чи» акцентом */
export function OgLogo({
  size,
  accent = og.accent,
  color = og.fg,
}: {
  size: number
  accent?: string
  color?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: 'Unbounded',
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '-0.04em',
        lineHeight: 1,
      }}
    >
      <span style={{ color }}>ву</span>
      <span style={{ color: accent }}>чи</span>
    </div>
  )
}

/** Розмір заголовка під довжину назви, щоб довгі назви не обрізались */
export const titleSize = (title: string, sizes: [number, number, number, number]) => {
  const len = title.length
  if (len <= 18) return sizes[0]
  if (len <= 34) return sizes[1]
  if (len <= 60) return sizes[2]
  return sizes[3]
}
