'use client'

import { XIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

type Props = {
  src: string
  alt?: string
  width?: number | null
  height?: number | null
  children: React.ReactNode
  className?: string
}

type Rect = { top: number; left: number; width: number; height: number }

// Відступ від країв вікна для збільшеної картинки
const VIEWPORT_PADDING = 16
const SPRING = { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 } as const

const toRect = (r: DOMRect): Rect => ({
  top: r.top,
  left: r.left,
  width: r.width,
  height: r.height,
})

// Максимальний розмір із збереженням пропорцій, що влазить у вікно і не більший за оригінал
function fitToViewport(source: Rect, natural: { width: number; height: number }): Rect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const ratio = natural.width / natural.height || source.width / source.height
  const maxW = Math.min(vw - VIEWPORT_PADDING * 2, Math.max(natural.width, source.width))
  const maxH = Math.min(vh - VIEWPORT_PADDING * 2, Math.max(natural.height, source.height))
  let width = maxW
  let height = width / ratio
  if (height > maxH) {
    height = maxH
    width = height * ratio
  }
  return { width, height, left: (vw - width) / 2, top: (vh - height) / 2 }
}

/**
 * Картинка з rich text, що на клік плавно збільшується з місця, де стоїть, на весь екран.
 * Закривається кліком, Esc або кнопкою; повертається на своє місце.
 */
export default function ZoomableImage({ src, alt = '', width, height, children, className }: Props) {
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const [origin, setOrigin] = useState<Rect | null>(null)
  const [target, setTarget] = useState<Rect | null>(null)
  const [open, setOpen] = useState(false)
  // Оригінал ховаємо, поки його копія в оверлеї — так здається, що літає саме він
  const [hidden, setHidden] = useState(false)
  const reduceMotion = useReducedMotion()

  const measure = useCallback(() => {
    const img = wrapperRef.current?.querySelector('img')
    if (!img) return null
    const rect = toRect(img.getBoundingClientRect())
    const natural = {
      width: img.naturalWidth || width || rect.width,
      height: img.naturalHeight || height || rect.height,
    }
    return { rect, natural }
  }, [width, height])

  const openZoom = () => {
    const m = measure()
    if (!m) return
    setOrigin(m.rect)
    setTarget(fitToViewport(m.rect, m.natural))
    setHidden(true)
    setOpen(true)
  }

  const closeZoom = useCallback(() => {
    // Сторінка могла зміститись (ресайз, догрузка) — повертаємось у поточну позицію
    const m = measure()
    if (m) setOrigin(m.rect)
    setOpen(false)
  }, [measure])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeZoom()
      }
    }
    const onResize = () => {
      const m = measure()
      if (m) setTarget(fitToViewport(m.rect, m.natural))
    }
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, closeZoom, measure])

  // Трансформація, що ставить збільшену картинку точно на місце оригіналу
  const fromOrigin =
    origin && target
      ? {
          x: origin.left + origin.width / 2 - (target.left + target.width / 2),
          y: origin.top + origin.height / 2 - (target.top + target.height / 2),
          scale: origin.width / target.width,
        }
      : undefined

  const imageVariants = {
    collapsed: (from: typeof fromOrigin) => (reduceMotion || !from ? { opacity: 0 } : from),
    expanded: { x: 0, y: 0, scale: 1, opacity: 1 },
  }

  return (
    <>
      <span
        ref={wrapperRef}
        role="button"
        tabIndex={0}
        aria-label={alt ? `Збільшити: ${alt}` : 'Збільшити зображення'}
        onClick={openZoom}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openZoom()
          }
        }}
        className={cn(
          'block cursor-zoom-in rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary',
          hidden && 'invisible',
          className,
        )}
      >
        {children}
      </span>
      {(open || hidden) &&
        createPortal(
          // custom — щоб анімація закриття взяла свіжу позицію оригіналу, а не ту, що була при відкритті
          <AnimatePresence custom={fromOrigin} onExitComplete={() => setHidden(false)}>
            {open && target && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label={alt || 'Зображення'}
                className="fixed inset-0 z-[100] cursor-zoom-out"
                onClick={closeZoom}
              >
                <motion.div
                  className="absolute inset-0 bg-background/90 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
                <motion.img
                  src={src}
                  alt={alt}
                  draggable={false}
                  className="absolute max-w-none rounded-2xl select-none shadow-float"
                  style={{
                    top: target.top,
                    left: target.left,
                    width: target.width,
                    height: target.height,
                  }}
                  custom={fromOrigin}
                  variants={imageVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={reduceMotion ? { duration: 0.15 } : SPRING}
                />
                <motion.button
                  type="button"
                  aria-label="Закрити"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeZoom()
                  }}
                  className="absolute top-3 right-3 flex size-11 cursor-pointer items-center justify-center rounded-[14px] bg-chip text-foreground shadow-float"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <XIcon className="size-5" />
                </motion.button>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
