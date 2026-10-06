import React from 'react'
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { DISPLAY, Palette, SANS } from './theme'

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// 16:9 чи 9:16 — сцени перекладають розкладку самі
export const useLayout = () => {
  const { width, height } = useVideoConfig()
  return { W: width, H: height, tall: height > width }
}

// Пружинний вхід з затримкою (у кадрах)
export const useEnter = (delay = 0, config: Parameters<typeof spring>[0]['config'] = {}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - delay, fps, config: { damping: 15, mass: 0.7, ...config } })
}

export const ease = (frame: number, from: number, to: number, out: [number, number] = [0, 1]) =>
  interpolate(frame, [from, to], out, { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) })

export const easeOut = (frame: number, from: number, to: number, out: [number, number] = [0, 1]) =>
  interpolate(frame, [from, to], out, { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })

export const Logo = ({
  size,
  p,
  vu,
  chi,
  style,
}: {
  size: number
  p: Palette
  vu?: string
  chi?: string
  style?: React.CSSProperties
}) => (
  <span
    style={{
      fontFamily: DISPLAY,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      color: vu ?? '#f5efe9',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    ву<span style={{ color: chi ?? p.acc }}>чи</span>
  </span>
)

export const Display = ({
  children,
  size,
  color = '#f5efe9',
  style,
}: {
  children: React.ReactNode
  size: number
  color?: string
  style?: React.CSSProperties
}) => (
  <div
    style={{
      fontFamily: DISPLAY,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: '-0.03em',
      lineHeight: 1.05,
      color,
      textWrap: 'balance',
      ...style,
    }}
  >
    {children}
  </div>
)

export const Text = ({
  children,
  size,
  color,
  weight = 500,
  style,
}: {
  children: React.ReactNode
  size: number
  color: string
  weight?: 500 | 700
  style?: React.CSSProperties
}) => (
  <div style={{ fontFamily: SANS, fontWeight: weight, fontSize: size, color, lineHeight: 1.45, ...style }}>
    {children}
  </div>
)

export const Cover = ({
  src,
  width,
  radius = 22,
  style,
}: {
  src: string
  width: number
  radius?: number
  style?: React.CSSProperties
}) => (
  <Img
    src={staticFile(src)}
    style={{
      width,
      height: width * 1.5,
      objectFit: 'cover',
      borderRadius: radius,
      display: 'block',
      flexShrink: 0,
      ...style,
    }}
  />
)

export const Pill = ({
  children,
  bg,
  color,
  size = 26,
  style,
}: {
  children: React.ReactNode
  bg: string
  color: string
  size?: number
  style?: React.CSSProperties
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.45,
      background: bg,
      color,
      fontFamily: SANS,
      fontWeight: 700,
      fontSize: size,
      padding: `${size * 0.55}px ${size * 0.9}px`,
      borderRadius: size * 0.75,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
)

export const shadowFloat = '0 24px 80px rgb(0 0 0 / 0.6)'
