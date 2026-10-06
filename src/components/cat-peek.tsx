'use client'

import Image from 'next/image'
import { motion, useReducedMotion, type Variants } from 'motion/react'

// Пасхалка: при наведенні на кота поверх фото віялом вилітають ще кілька його світлин
const cardVariants: Variants = {
  rest: { x: 0, y: 0, rotate: 0, scale: 0.85, opacity: 0 },
  hover: (i: number) => ({
    x: [170, 215, 160][i % 3],
    y: [-190, 10, 205][i % 3],
    rotate: [14, -5, 9][i % 3],
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 260, damping: 18, delay: i * 0.06 },
  }),
}

export function CatPeek({ src, alt, extras }: { src: string; alt: string; extras: string[] }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover={reduceMotion ? undefined : 'hover'}
      className="relative hidden min-h-[560px] lg:block"
    >
      <motion.div
        variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -2, scale: 0.97 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="absolute inset-0 overflow-hidden rounded-tile bg-tile"
      >
        <Image src={src} alt={alt} fill sizes="560px" className="object-cover object-center" priority />
      </motion.div>

      {extras.map((photo, i) => (
        <motion.div
          key={photo}
          custom={i}
          variants={cardVariants}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="pointer-events-none absolute left-1/2 top-1/2 -ml-[90px] -mt-[115px] h-[230px] w-[180px] rounded-tile-sm bg-chip p-2 shadow-float"
          aria-hidden
        >
          <span className="relative block size-full overflow-hidden rounded-2xl">
            <Image src={photo} alt="" fill sizes="180px" className="object-cover" />
          </span>
        </motion.div>
      ))}
    </motion.div>
  )
}
