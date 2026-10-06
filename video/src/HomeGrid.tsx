import { BookOpen, Compass, Home, Library, Search, UserRound } from 'lucide-react'
import React from 'react'
import { interpolate, spring, useVideoConfig } from 'remotion'
import books from './books.json'
import { Palette, SANS } from './theme'
import { clamp, Cover, Display, Logo, Pill, Text } from './ui'

const spotlight = books[0]
const continueBook = books[1]
const freshRow = [books[8], books[5], books[2], books[9], books[10], books[6], books[21], books[13]]
const genres = ['Усі', 'Культивування', 'Фентезі', 'Бойові мистецтва', 'Корейське', 'Сянься', 'Романтика', 'Містика', 'LitRPG']

// Плитка, що «прилітає» знизу з пружиною
const Fly = ({
  t,
  i,
  style,
  children,
}: {
  t: number
  i: number
  style: React.CSSProperties
  children: React.ReactNode
}) => {
  const { fps } = useVideoConfig()
  const s = spring({ frame: t - i * 4, fps, config: { damping: 14, mass: 0.8 } })
  return (
    <div
      style={{
        position: 'absolute',
        ...style,
        opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
        transform: `translateY(${(1 - s) * 160}px) scale(${0.86 + 0.14 * s}) rotate(${(1 - s) * (i % 2 ? 4 : -4)}deg)`,
      }}
    >
      {children}
    </div>
  )
}

// Мокап головної в одній палітрі. t — локальний кадр для входу плиток
export const HomeGrid = ({ p, t, tall }: { p: Palette; t: number; tall: boolean }) => {
  const { fps } = useVideoConfig()
  const tile = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: p.tile,
    borderRadius: 40,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    ...extra,
  })

  // Прогрес у «Продовжити» набігає
  const prog = interpolate(t, [24, 70], [0, 64], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) })
  const chapter = Math.round(interpolate(t, [24, 70], [1, 1457], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) }))

  // Ряд обкладинок повільно їде
  const rowShift = interpolate(t, [0, 300], [0, -260])

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: tall ? 0 : 44, height: '100%' }}>
      <Logo size={tall ? 46 : 40} p={p} />
      {!tall &&
        ['Головна', 'Всі ранобе', 'Оригінали', 'Блог'].map((n, k) => (
          <Text key={n} size={25} weight={700} color={k === 0 ? p.fg : p.muted}>
            {n}
          </Text>
        ))}
      <div style={{ flex: 1 }} />
      {!tall && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: p.tile,
            borderRadius: 20,
            height: 62,
            padding: '0 24px',
            width: 380,
            marginRight: 16,
          }}
        >
          <Search size={26} color={p.muted} />
          <Text size={23} color={p.muted}>
            Знайти ранобе
          </Text>
        </div>
      )}
      <Pill bg={p.acc} color={p.ink} size={tall ? 28 : 24} style={{ height: 62, boxSizing: 'border-box' }}>
        Реєстрація
      </Pill>
    </div>
  )

  const spotlightTile = (
    <div style={tile({ display: 'flex', flexDirection: tall ? 'column-reverse' : 'row' })}>
      <div
        style={{
          flex: 1,
          padding: tall ? '36px 44px 44px' : '56px 56px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <Text size={tall ? 22 : 20} weight={700} color={p.acc} style={{ letterSpacing: '0.12em' }}>
          НОВИНКА ТИЖНЯ
        </Text>
        <Display size={tall ? 66 : 76} color={p.fg}>
          {spotlight.title}
        </Display>
        {!tall && (
          <Text size={26} color={p.soft} style={{ maxWidth: 640 }}>
            Усе життя Ю Ільхана залишали позаду. Одного квітневого дня він виходить з аудиторії й бачить, що
            Земля спорожніла…
          </Text>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <Pill bg={p.acc} color={p.ink} size={28}>
            Читати
          </Pill>
          <Text size={23} color={p.muted}>
            {spotlight.genres.join(' · ')}
          </Text>
        </div>
      </div>
      <Cover
        src={spotlight.cover}
        width={tall ? 984 : 470}
        radius={0}
        style={{
          height: tall ? 470 : '100%',
          transform: `scale(${interpolate(t, [0, 120], [1.15, 1], clamp)})`,
        }}
      />
    </div>
  )

  const continueTile = (
    <div
      style={tile({
        background: p.acc,
        padding: tall ? 44 : 40,
        display: 'flex',
        gap: 30,
        alignItems: 'stretch',
      })}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <Text size={23} weight={700} color={p.ink}>
          Продовжити
        </Text>
        <Display size={tall ? 52 : 40} color={p.ink}>
          {continueBook.title}
        </Display>
        <div style={{ flex: 1 }} />
        <Text size={24} weight={700} color={p.ink} style={{ opacity: 0.75 }}>
          Розділ {chapter} · {Math.round(prog)}%
        </Text>
        <div style={{ height: 12, borderRadius: 99, background: 'rgb(0 0 0 / 0.18)', overflow: 'hidden' }}>
          <div style={{ width: `${prog}%`, height: '100%', borderRadius: 99, background: p.ink }} />
        </div>
      </div>
      <Cover
        src={continueBook.cover}
        width={tall ? 180 : 130}
        radius={18}
        style={{
          alignSelf: 'center',
          transform: `rotate(${interpolate(spring({ frame: t - 20, fps }), [0, 1], [0, 4])}deg)`,
          boxShadow: '0 16px 40px rgb(0 0 0 / 0.35)',
        }}
      />
    </div>
  )

  const quoteTile = (
    <div style={tile({ padding: tall ? '36px 44px' : '32px 40px', display: 'flex', flexDirection: 'column', gap: 14 })}>
      <Text size={22} weight={700} color={p.muted}>
        Kolrae · За межами Часопростору
      </Text>
      <Text size={tall ? 30 : 27} color={p.fg}>
        «Вони завжди були каталізатором для концентрації в одному місці…»
      </Text>
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        {[0, 1, 2, 3].map((k) => (
          <div
            key={k}
            style={{ width: k === 0 ? 34 : 10, height: 10, borderRadius: 99, background: k === 0 ? p.acc : p.chip }}
          />
        ))}
      </div>
    </div>
  )

  const chips = (
    <div style={{ display: 'flex', gap: 12 }}>
      {genres.map((g, k) => (
        <Pill key={g} bg={k === 0 ? p.fg : p.tile} color={k === 0 ? p.bg : p.fg} size={24}>
          {g}
        </Pill>
      ))}
    </div>
  )

  const fresh = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Display size={tall ? 56 : 52} color={p.fg}>
          Свіжі книги
        </Display>
        <Text size={24} weight={700} color={p.acc}>
          Усі ранобе →
        </Text>
      </div>
      <div style={{ display: 'flex', gap: 22, transform: `translateX(${rowShift}px)` }}>
        {freshRow.map((b) => (
          <Cover key={b.cover} src={b.cover} width={tall ? 300 : 262} radius={24} />
        ))}
      </div>
    </div>
  )

  if (tall) {
    const x = 48
    const w = 984
    return (
      <div style={{ position: 'absolute', inset: 0, background: p.bg, overflow: 'hidden' }}>
        <Fly t={t} i={0} style={{ left: x, top: 70, width: w, height: 70 }}>
          {header}
        </Fly>
        <Fly t={t} i={1} style={{ left: x, top: 170, width: w, height: 790 }}>
          {spotlightTile}
        </Fly>
        <Fly t={t} i={2} style={{ left: x, top: 980, width: w, height: 330 }}>
          {continueTile}
        </Fly>
        <Fly t={t} i={3} style={{ left: x, top: 1330, width: w, height: 220 }}>
          {quoteTile}
        </Fly>
        <Fly t={t} i={4} style={{ left: x, top: 1580, width: 2000 }}>
          {fresh}
        </Fly>
        <Fly t={t} i={6} style={{ left: x, top: 1740, width: w, height: 128 }}>
          <MobileNav p={p} />
        </Fly>
      </div>
    )
  }

  const x = 96
  const w = 1728
  return (
    <div style={{ position: 'absolute', inset: 0, background: p.bg, overflow: 'hidden' }}>
      <Fly t={t} i={0} style={{ left: x, top: 40, width: w, height: 80 }}>
        {header}
      </Fly>
      <Fly t={t} i={1} style={{ left: x, top: 146, width: 1134, height: 560 }}>
        {spotlightTile}
      </Fly>
      <Fly t={t} i={2} style={{ left: x + 1154, top: 146, width: w - 1154, height: 360 }}>
        {continueTile}
      </Fly>
      <Fly t={t} i={3} style={{ left: x + 1154, top: 526, width: w - 1154, height: 180 }}>
        {quoteTile}
      </Fly>
      <Fly t={t} i={4} style={{ left: x, top: 730, width: 2400 }}>
        {chips}
      </Fly>
      <Fly t={t} i={5} style={{ left: x, top: 830, width: w }}>
        {fresh}
      </Fly>
    </div>
  )
}

export const MobileNav = ({ p, active = 0 }: { p: Palette; active?: number }) => {
  const items = [
    { icon: Home, label: 'Головна' },
    { icon: Compass, label: 'Каталог' },
    { icon: Library, label: 'Читаю' },
    { icon: BookOpen, label: 'Блог' },
    { icon: UserRound, label: 'Профіль' },
  ]
  return (
    <div
      style={{
        height: '100%',
        borderRadius: 44,
        background: p.chip,
        boxShadow: '0 24px 80px rgb(0 0 0 / 0.7)',
        display: 'flex',
        alignItems: 'center',
        padding: 12,
        gap: 6,
      }}
    >
      {items.map(({ icon: Icon, label }, k) => (
        <div
          key={label}
          style={{
            flex: 1,
            height: '100%',
            borderRadius: 34,
            background: k === active ? p.acc : 'transparent',
            color: k === active ? p.ink : p.muted,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 20,
          }}
        >
          <Icon size={34} strokeWidth={2.2} />
          {label}
        </div>
      ))}
    </div>
  )
}
