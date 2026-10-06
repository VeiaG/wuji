import {
  AlignLeft,
  ArrowRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Filter,
  MessageCircle,
  MessageSquareQuote,
  Navigation,
  Palette as PaletteIcon,
  Settings2,
  Type,
} from 'lucide-react'
import React from 'react'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import books from './books.json'
import { HomeGrid } from './HomeGrid'
import { Palette, palettes, READER, readerBgs, SANS, tangerine } from './theme'
import { clamp, Cover, Display, ease, easeOut, Logo, Pill, shadowFloat, Text, useLayout } from './ui'

const p = tangerine

// Коло, що розкривається з точки: clip-path для переходів
const circle = (r: number, x: number, y: number) => `circle(${r}px at ${x}px ${y}px)`

/* ---------------- 1. Було ---------------- */
export const BeforeScene = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { W, H, tall } = useLayout()

  const enter = spring({ frame: f, fps, config: { damping: 20 } })
  const drop = ease(f, 50, 80)
  const wipe = ease(f, 62, 90)
  const shotW = tall ? 760 : 1500

  return (
    <AbsoluteFill style={{ background: '#080808' }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Img
          src={staticFile(tall ? 'old/home-mobile.png' : 'old/home-desktop.png')}
          style={{
            width: shotW,
            borderRadius: 28,
            boxShadow: '0 0 0 2px rgb(255 255 255 / 0.08), 0 40px 120px rgb(0 0 0 / 0.8)',
            opacity: interpolate(enter, [0, 0.5], [0, 1], clamp),
            filter: `grayscale(${ease(f, 6, 30)}) brightness(${1 - 0.5 * ease(f, 6, 30)})`,
            transform: [
              `translateY(${drop * 500}px)`,
              `scale(${(1.12 - 0.12 * enter + 0.04 * ease(f, 0, 56)) * (1 - drop * 0.35)})`,
              `rotate(${drop * -10}deg)`,
            ].join(' '),
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: tall ? 70 : 150,
          bottom: tall ? 330 : 110,
          opacity: easeOut(f, 12, 26) * (1 - ease(f, 46, 56)),
          transform: `translateY(${(1 - easeOut(f, 12, 30)) * 60}px)`,
        }}
      >
        <Pill bg="#1c1c1c" color="#bbb" size={tall ? 30 : 28} style={{ marginBottom: 20 }}>
          wuji.world · досі
        </Pill>
        <Display size={tall ? 120 : 132} style={{ textShadow: '0 8px 40px rgb(0 0 0 / 0.9)' }}>
          Було так.
        </Display>
      </div>

      <AbsoluteFill style={{ background: p.acc, clipPath: circle(wipe * Math.hypot(W, H), W / 2, H / 2) }} />
    </AbsoluteFill>
  )
}

/* ---------------- 2. Логотип ---------------- */
export const LogoScene = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { W, H, tall } = useLayout()

  const pop = spring({ frame: f - 2, fps, config: { damping: 10, mass: 0.6 } })
  const reveal = ease(f, 30, 46)
  const sub = spring({ frame: f - 45, fps, config: { damping: 14 } })
  const out = ease(f, 76, 90)
  const size = tall ? 230 : 280

  const content = (vu: string, chi: string, showSub: boolean) => (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        flexDirection: 'column',
        transform: `scale(${(0.4 + 0.6 * pop) * (1 + out * 0.15)})`,
        opacity: 1 - out,
      }}
    >
      <Logo size={size} p={p} vu={vu} chi={chi} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          opacity: showSub ? interpolate(sub, [0, 0.4], [0, 1], clamp) : 0,
          transform: `translateY(${(1 - sub) * 50}px)`,
        }}
      >
        <Display size={tall ? 64 : 70} color={p.soft}>
          новий дизайн
        </Display>
        <Pill bg={p.chip} color={p.acc} size={tall ? 30 : 32}>
          4.0
        </Pill>
      </div>
    </AbsoluteFill>
  )

  return (
    <AbsoluteFill style={{ background: p.acc }}>
      {content(p.ink, '#fff4ea', false)}
      <AbsoluteFill style={{ background: p.bg, clipPath: circle(reveal * Math.hypot(W, H) * 0.6, W / 2, H / 2) }}>
        {content('#f5efe9', p.acc, true)}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ---------------- 3. Головна + палітри ---------------- */
const PAL_START = 180
const PAL_SEG = 15
const PAL_ORDER = [0, 1, 2, 3, 4, 5, 0]

export const HOME_DURATION = 300

const PaletteLabel = ({ pal, idx, show }: { pal: Palette; idx: number; show: number }) => {
  const { tall } = useLayout()
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: tall ? 110 : 52,
        display: 'flex',
        flexDirection: tall ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tall ? 26 : 40,
        opacity: interpolate(show, [0, 0.4], [0, 1], clamp),
        transform: `translateY(${(1 - show) * 80}px)`,
      }}
    >
      <Display size={tall ? 72 : 58} color={pal.fg}>
        6 палітр
      </Display>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background: pal.tile,
          borderRadius: 999,
          padding: '14px 30px 14px 16px',
          boxShadow: shadowFloat,
        }}
      >
        {palettes.map((q, k) => (
          <div
            key={q.id}
            style={{
              width: k === idx ? 52 : 30,
              height: k === idx ? 52 : 30,
              borderRadius: 99,
              background: q.acc,
              boxShadow: k === idx ? `0 0 0 5px ${pal.tile}, 0 0 0 9px ${q.acc}` : 'none',
              margin: k === idx ? '0 10px' : 0,
            }}
          />
        ))}
        <Text size={tall ? 38 : 34} weight={700} color={pal.fg} style={{ marginLeft: 14, minWidth: tall ? 190 : 170 }}>
          {pal.label}
        </Text>
      </div>
    </div>
  )
}

export const HomeScene = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { W, H, tall } = useLayout()

  const tiltIn = easeOut(f, 0, 70)
  const zoomOut = ease(f, PAL_START - 30, PAL_START - 4)
  const labelIn = spring({ frame: f - (PAL_START - 16), fps, config: { damping: 14 } })

  const targetScale = tall ? 0.8 : 0.78
  const scale = (1.12 - 0.12 * tiltIn) * (1 - (1 - targetScale) * zoomOut)
  const shiftY = zoomOut * (tall ? -130 : -72)

  // Поточний сегмент палітр і прогрес кола
  const seg = Math.max(0, Math.min(5, Math.floor((f - PAL_START) / PAL_SEG)))
  const segF = f - PAL_START - seg * PAL_SEG
  const r = f < PAL_START ? 0 : ease(segF, 0, 9)
  const from = PAL_ORDER[seg]
  const to = PAL_ORDER[seg + 1]

  // Коло розходиться з плитки «Продовжити»
  const ox = tall ? W / 2 : W / 2 + (1530 - W / 2) * targetScale
  const oy = tall ? H / 2 + (1145 - H / 2) * targetScale + shiftY : H / 2 + (311 - H / 2) * targetScale + shiftY

  const stage = (pal: Palette, idx: number) => (
    <AbsoluteFill style={{ background: pal.bg }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${shiftY}px) perspective(2400px) rotateX(${(1 - tiltIn) * 22}deg) scale(${scale})`,
          borderRadius: 56 * zoomOut,
          overflow: 'hidden',
          boxShadow: zoomOut > 0 ? `0 0 0 3px rgb(255 255 255 / ${0.07 * zoomOut}), ${shadowFloat}` : 'none',
        }}
      >
        <HomeGrid p={pal} t={f} tall={tall} />
      </AbsoluteFill>
      <PaletteLabel pal={pal} idx={idx} show={labelIn} />
    </AbsoluteFill>
  )

  return (
    <AbsoluteFill>
      {stage(palettes[from], from)}
      {r > 0 && (
        <AbsoluteFill style={{ clipPath: circle(r * Math.hypot(W, H) * 1.1, ox, oy) }}>
          {stage(palettes[to], to)}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}

/* ---------------- 4. Читалка ---------------- */
const chapterText = [
  'Серед безкраїх просторів туманного снігу незліченні крижані пластівці кружляли в хороводі, підхоплені морозними вітрами.',
  'Це Царство Снігопаду, одне з численних царств у межах Божественного Володіння. У Царстві Снігопаду вічно йде сніг, перетворюючи будь-який слід води на морозну паморозь.',
  'Серед цих безлюдних снігових земель сніжинки раптово закрутилися спіраллю, ніби під дією чогось невидимого. Сяюча завіса, що нагадувала ртуть, з’явилася просто з повітря.',
  'Наступної миті з неї вийшла жінка в океанічно-блакитній сукні. Від неї виходила аура величі, її чорне волосся спадало водоспадом.',
  'Сяюча завіса зникла, і жінка виплюнула повний рот крові, її свідомість почала згасати.',
  '— Сестро!',
]

type ReaderColors = { bg: string; fg: string; soft: string; muted: string; chip: string }
const darkReader: ReaderColors = { bg: p.bg, fg: p.fg, soft: p.soft, muted: p.muted, chip: p.chip }

const ReaderPage = ({ c, scroll, progress, tall }: { c: ReaderColors; scroll: number; progress: number; tall: boolean }) => (
  <AbsoluteFill style={{ background: c.bg }}>
    <div
      style={{
        position: 'absolute',
        top: 140,
        left: tall ? 64 : 90,
        right: tall ? 64 : 90,
        transform: `translateY(${-scroll}px)`,
      }}
    >
      <Text size={24} weight={700} color={c.muted} style={{ marginBottom: 14 }}>
        Розділ 1
      </Text>
      <Display size={tall ? 64 : 58} color={c.fg} style={{ marginBottom: 40 }}>
        Пролог: Магічний Куб
      </Display>
      {chapterText.map((t) => (
        <p
          key={t}
          style={{ fontFamily: READER, fontSize: tall ? 36 : 31, lineHeight: 1.7, color: c.soft, margin: '0 0 28px' }}
        >
          {t}
        </p>
      ))}
    </div>
    <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, height: 8, width: `${progress}%`, background: p.acc }} />
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 110,
        padding: '0 56px',
        background: c.bg,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <Logo size={34} p={p} vu={c.fg} />
      <Text size={24} weight={700} color={c.muted} style={{ marginLeft: 12 }}>
        Світ Бойових Мистецтв
      </Text>
    </div>
  </AbsoluteFill>
)

const ReaderPanel = ({ aaActive, tall }: { aaActive: boolean; tall: boolean }) => {
  const btn = (child: React.ReactNode, active = false, wide = false) => (
    <div
      style={{
        height: 76,
        minWidth: 76,
        padding: wide ? '0 26px' : 0,
        borderRadius: 24,
        display: 'grid',
        placeItems: 'center',
        background: active ? p.acc : p.chip,
        color: active ? p.ink : p.fg,
      }}
    >
      {child}
    </div>
  )
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        background: p.tile,
        borderRadius: 34,
        boxShadow: shadowFloat,
        transform: tall ? 'scale(1.05)' : undefined,
      }}
    >
      {btn(<AlignLeft size={32} />)}
      {btn(<ChevronLeft size={34} />)}
      <div style={{ width: tall ? 150 : 170, padding: '0 10px' }}>
        <Text size={22} weight={700} color={p.muted} style={{ textAlign: 'center' }}>
          12%
        </Text>
        <div style={{ height: 8, borderRadius: 99, background: p.chip, marginTop: 6 }}>
          <div style={{ width: '12%', height: '100%', borderRadius: 99, background: p.acc }} />
        </div>
      </div>
      {btn(<MessageCircle size={32} />)}
      {btn(<ChevronRight size={34} />)}
      {btn(<span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30 }}>Aa</span>, aaActive)}
    </div>
  )
}

const BG_ORDER = ['theme', 'sepia', 'light'] as const
const BG_LABEL = { theme: 'Тема', sepia: 'Сепія', light: 'Світлий' }

export const ReaderScene = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { tall } = useLayout()

  const frameIn = spring({ frame: f, fps, config: { damping: 16 } })
  const popIn = spring({ frame: f - 30, fps, config: { damping: 13 } })
  const popOut = ease(f, 158, 170)
  const toSepia = ease(f, 60, 72)
  const toLight = ease(f, 120, 132)
  const scroll = interpolate(f, [0, 180], [0, tall ? 280 : 370])
  const progress = interpolate(f, [0, 180], [4, 36])
  const active = f < 64 ? 0 : f < 124 ? 1 : 2

  // Розміри «екрана» з читалкою
  const sw = tall ? 960 : 980
  const sh = tall ? 1320 : 940
  const sx = tall ? 60 : 860
  const sy = tall ? 500 : 70

  // Центр кружечка-перемикача в поповері (координати всередині екрана)
  const swatchX = (k: number) => sw - 56 - 340 + 30 + 45 + k * 112
  const swatchY = sh - 150 - 190 + 100

  const sepiaC: ReaderColors = { ...readerBgs.sepia }
  const lightC: ReaderColors = { ...readerBgs.light }

  const features = [
    { icon: Columns2, label: 'Стрічка або сторінки' },
    { icon: PaletteIcon, label: 'Темний, сепія, світлий' },
    { icon: Type, label: 'Шрифт і розмір під себе' },
  ]

  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <div
        style={{
          position: 'absolute',
          left: tall ? 60 : 120,
          top: tall ? 110 : 0,
          bottom: tall ? undefined : 0,
          width: tall ? 960 : 680,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: tall ? 22 : 30,
        }}
      >
        <Text size={26} weight={700} color={p.acc} style={{ letterSpacing: '0.12em', opacity: easeOut(f, 4, 16) }}>
          ЧИТАЛКА
        </Text>
        <Display
          size={tall ? 104 : 112}
          style={{ opacity: easeOut(f, 6, 20), transform: `translateY(${(1 - easeOut(f, 6, 26)) * 40}px)` }}
        >
          Нова читалка
        </Display>
        <div style={{ display: 'flex', flexDirection: tall ? 'row' : 'column', flexWrap: 'wrap', gap: tall ? 12 : 16, marginTop: 10 }}>
          {features.map(({ icon: Icon, label }, k) => {
            const s = spring({ frame: f - 18 - k * 6, fps, config: { damping: 14 } })
            return (
              <Pill
                key={label}
                bg={p.tile}
                color={p.fg}
                size={tall ? 27 : 30}
                style={{ opacity: interpolate(s, [0, 0.4], [0, 1], clamp), transform: `translateX(${(1 - s) * -60}px)` }}
              >
                <Icon size={tall ? 30 : 34} color={p.acc} />
                {label}
              </Pill>
            )
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: sx,
          top: sy,
          width: sw,
          height: sh,
          borderRadius: 48,
          overflow: 'hidden',
          boxShadow: `0 0 0 3px rgb(255 255 255 / 0.07), ${shadowFloat}`,
          opacity: interpolate(frameIn, [0, 0.4], [0, 1], clamp),
          transform: `perspective(2400px) translateY(${(1 - frameIn) * 300}px) rotateY(${tall ? 0 : -6 + 3 * ease(f, 0, 180)}deg) rotateX(${tall ? 6 - 4 * ease(f, 0, 180) : 0}deg)`,
        }}
      >
        <ReaderPage c={darkReader} scroll={scroll} progress={progress} tall={tall} />
        <AbsoluteFill style={{ clipPath: circle(toSepia * 1800, swatchX(1), swatchY) }}>
          <ReaderPage c={sepiaC} scroll={scroll} progress={progress} tall={tall} />
        </AbsoluteFill>
        <AbsoluteFill style={{ clipPath: circle(toLight * 1800, swatchX(2), swatchY) }}>
          <ReaderPage c={lightC} scroll={scroll} progress={progress} tall={tall} />
        </AbsoluteFill>

        {/* Поповер «Фон тексту» над кнопкою Aa */}
        <div
          style={{
            position: 'absolute',
            right: 56,
            bottom: 150,
            width: 340,
            height: 190,
            boxSizing: 'border-box',
            padding: '24px 30px',
            background: p.tile,
            borderRadius: 30,
            boxShadow: shadowFloat,
            opacity: interpolate(popIn, [0, 0.4], [0, 1], clamp) * (1 - popOut),
            transform: `translateY(${(1 - popIn) * 30 + popOut * 20}px) scale(${0.92 + 0.08 * popIn})`,
            transformOrigin: 'bottom right',
          }}
        >
          <Text size={21} weight={700} color={p.muted}>
            Фон тексту
          </Text>
          <div style={{ display: 'flex', gap: 22, marginTop: 18 }}>
            {BG_ORDER.map((b, k) => (
              <div key={b} style={{ width: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 99,
                    background: b === 'theme' ? p.bg : readerBgs[b].bg,
                    boxShadow:
                      active === k
                        ? `0 0 0 4px ${p.tile}, 0 0 0 8px ${p.acc}`
                        : '0 0 0 2px rgb(255 255 255 / 0.15)',
                  }}
                />
                <Text size={19} weight={700} color={active === k ? p.fg : p.muted}>
                  {BG_LABEL[b]}
                </Text>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <ReaderPanel aaActive={popIn > 0.5 && popOut < 0.5} tall={tall} />
        </div>
      </div>
    </AbsoluteFill>
  )
}

/* ---------------- 5. І ще ---------------- */
const extras = [
  { icon: Filter, label: 'Фільтри за жанрами' },
  { icon: Settings2, label: 'Нові налаштування' },
  { icon: Navigation, label: 'Плаваюча навігація' },
  { icon: MessageSquareQuote, label: 'Цитати з коментарів' },
  { icon: Bell, label: 'Нові сповіщення' },
  { icon: ArrowRight, label: 'Продовжити з місця' },
]
const cats = ['cats/aska-1.jpg', 'cats/oskar-2.jpg', 'cats/aska-3.jpg', 'cats/oskar-1.jpg']

export const ExtrasScene = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { tall } = useLayout()

  const head = spring({ frame: f, fps, config: { damping: 13 } })
  const out = ease(f, 108, 120)

  // Позиції чипів довкола заголовка (відносно центру)
  const spots = tall
    ? [[-240, -520], [220, -400], [-250, -280], [230, 280], [-230, 400], [240, 520]]
    : [[-470, -330], [20, -390], [500, -300], [-490, 300], [-10, 370], [470, 320]]
  // Котики вилітають з-за заголовка
  const catSpots = tall
    ? [[-300, -790, -12], [320, -770, 10], [-310, 790, 8], [300, 810, -9]]
    : [[-790, -170, -12], [800, -190, 10], [-770, 250, 8], [790, 240, -9]]

  return (
    <AbsoluteFill style={{ background: p.bg, alignItems: 'center', justifyContent: 'center', opacity: 1 - out }}>
      {cats.map((src, k) => {
        const s = spring({ frame: f - 60 - k * 4, fps, config: { damping: 11, mass: 0.7 } })
        const [x, y, rot] = catSpots[k]
        return (
          <div
            key={src}
            style={{
              position: 'absolute',
              padding: 12,
              background: p.chip,
              borderRadius: 30,
              boxShadow: shadowFloat,
              opacity: interpolate(s, [0, 0.2], [0, 1], clamp),
              transform: `translate(${x * s}px, ${y * s}px) rotate(${rot * s}deg) scale(${0.5 + 0.5 * s})`,
            }}
          >
            <Img
              src={staticFile(src)}
              style={{ width: tall ? 250 : 230, height: tall ? 310 : 290, objectFit: 'cover', borderRadius: 20, display: 'block' }}
            />
          </div>
        )
      })}

      {extras.map(({ icon: Icon, label }, k) => {
        const s = spring({ frame: f - 10 - k * 4, fps, config: { damping: 13 } })
        const [x, y] = spots[k]
        return (
          <div
            key={label}
            style={{
              position: 'absolute',
              opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
              transform: `translate(${x * s}px, ${y * s}px) scale(${0.6 + 0.4 * s})`,
            }}
          >
            <Pill bg={p.tile} color={p.fg} size={tall ? 30 : 32} style={{ boxShadow: shadowFloat }}>
              <Icon size={tall ? 32 : 36} color={p.acc} />
              {label}
            </Pill>
          </div>
        )
      })}

      <div
        style={{
          textAlign: 'center',
          transform: `scale(${0.7 + 0.3 * head})`,
          opacity: interpolate(head, [0, 0.4], [0, 1], clamp),
        }}
      >
        <Display size={tall ? 110 : 128} style={{ maxWidth: tall ? 900 : 1300 }}>
          і ще купа <span style={{ color: p.acc }}>всього</span>
        </Display>
        <Text
          size={tall ? 36 : 38}
          weight={700}
          color={p.muted}
          style={{ marginTop: 24, opacity: easeOut(f, 60, 72) }}
        >
          навіть котики на вході
        </Text>
      </div>
    </AbsoluteFill>
  )
}

/* ---------------- 6. Фінал ---------------- */
const columns = [0, 1, 2, 3, 4, 5].map((c) => books.slice(c * 6, c * 6 + 6).concat(books.slice(c * 6, c * 6 + 6)))

export const OutroScene = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { tall } = useLayout()

  const logo = spring({ frame: f, fps, config: { damping: 11, mass: 0.7 } })
  const line = spring({ frame: f - 14, fps, config: { damping: 14 } })
  const btn = spring({ frame: f - 24, fps, config: { damping: 10 } })
  const fadeOut = ease(f, 108, 120)
  const coverW = tall ? 300 : 280
  const cols = tall ? 4 : 7

  return (
    <AbsoluteFill style={{ background: p.bg, opacity: 1 - fadeOut }}>
      {/* Стіна обкладинок, що повільно пливе */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 24,
          justifyContent: 'center',
          opacity: 0.3 * easeOut(f, 0, 30),
          transform: 'rotate(-8deg) scale(1.3)',
        }}
      >
        {Array.from({ length: cols }).map((_, c) => {
          const dir = c % 2 ? 1 : -1
          const y = -600 + dir * interpolate(f, [0, 120], [0, 220]) - (c % 2) * 200
          return (
            <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: 24, transform: `translateY(${y}px)` }}>
              {columns[c % columns.length].map((b, k) => (
                <Cover key={k} src={b.cover} width={coverW} radius={26} />
              ))}
            </div>
          )
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${p.bg} 20%, transparent 70%)` }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30 }}>
        <div style={{ transform: `scale(${logo})` }}>
          <Logo size={tall ? 240 : 260} p={p} />
        </div>
        <Text
          size={tall ? 46 : 48}
          weight={700}
          color={p.soft}
          style={{ opacity: interpolate(line, [0, 0.4], [0, 1], clamp), transform: `translateY(${(1 - line) * 30}px)` }}
        >
          Ранобе українською
        </Text>
        <div style={{ transform: `scale(${btn})`, marginTop: 20 }}>
          <Pill bg={p.acc} color={p.ink} size={tall ? 46 : 46} style={{ padding: '28px 48px', borderRadius: 34 }}>
            wuji.world
            <ArrowRight size={46} strokeWidth={2.6} />
          </Pill>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
