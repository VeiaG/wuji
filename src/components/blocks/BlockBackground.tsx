import Image from 'next/image'
import { Media } from '@/payload-types'

/**
 * Ambient градієнтний фон секції з зображення контенту.
 * Параметри ефекту згідно дизайн-системи: opacity-30, blur-2xl, scale-125 + gradient overlay.
 */
const BlockBackground: React.FC<{ image?: string | Media | null }> = ({ image }) => {
  if (!image || typeof image !== 'object' || !image.url) return null

  return (
    <>
      <Image
        src={image.url}
        alt=""
        width={image.width || 300}
        height={image.height || 450}
        className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-30 blur-2xl pointer-events-none scale-125"
      />
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-background/50 via-background/30 to-background/50 pointer-events-none" />
    </>
  )
}

export default BlockBackground
