import Image from 'next/image'
import { HeroBlock } from '@/payload-types'
import { Tile } from '@/components/bento'
import { cn } from '@/lib/utils'
import { BlockIcon } from './icons'
import { BlockLinks } from './BlockLinks'

const HeroBlockComponent: React.FC<HeroBlock> = ({
  icon,
  heading,
  subheading,
  badges,
  links,
  backgroundImage,
}) => {
  const image =
    backgroundImage && typeof backgroundImage === 'object' && backgroundImage.url
      ? backgroundImage
      : null

  return (
    <section className="container-page py-[7px]">
      <Tile className="relative isolate flex overflow-hidden">
        <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-4 p-6 sm:p-8 md:gap-5 md:p-12">
          {icon && (
            <span className="flex size-12 items-center justify-center rounded-[14px] bg-chip text-primary">
              <BlockIcon icon={icon} className="size-6" />
            </span>
          )}
          <h1 className="heading-display max-w-[20ch] text-[clamp(30px,4.4vw,52px)]">{heading}</h1>
          {subheading && (
            <p className="max-w-[60ch] text-base leading-[1.55] text-soft md:text-lg">{subheading}</p>
          )}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.id || badge.label}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[10px] px-3 py-[7px] text-[13px] font-semibold',
                    badge.variant === 'default'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-chip text-soft',
                  )}
                >
                  <BlockIcon icon={badge.icon} className="size-3.5" />
                  {badge.label}
                </span>
              ))}
            </div>
          )}
          <BlockLinks links={links} className="mt-1" />
        </div>
        {image?.url && (
          <span className="pointer-events-none absolute inset-0 -z-10 md:relative md:inset-auto md:z-auto md:w-[38%] md:max-w-[460px] md:shrink-0">
            <Image
              src={image.url}
              alt={image.alt || ''}
              fill
              sizes="(min-width: 768px) 460px, 100vw"
              className="object-cover opacity-40 md:opacity-100"
            />
            {/* Затемнення для читабельності тексту */}
            <span className="absolute inset-0 bg-gradient-to-t from-tile via-tile/70 to-tile/30 md:bg-gradient-to-r md:from-tile md:via-tile/10 md:to-transparent" />
          </span>
        )}
      </Tile>
    </section>
  )
}

export default HeroBlockComponent
