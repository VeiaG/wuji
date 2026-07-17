import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroBlock } from '@/payload-types'
import { BlockIcon } from './icons'
import { cn } from '@/lib/utils'

type BlockLink = NonNullable<HeroBlock['links']>[number]

/**
 * Рендер масиву посилань блоку як кнопок.
 * Внутрішні посилання (/novels) — через next/link, зовнішні — через <a>.
 */
export const BlockLinks: React.FC<{
  links?: BlockLink[] | null
  className?: string
}> = ({ links, className }) => {
  if (!links?.length) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {links.map((link) => {
        const isExternal = /^https?:\/\//.test(link.url)
        const icon = <BlockIcon icon={link.icon} className="h-4 w-4" />

        return (
          <Button key={link.id || link.url} variant={link.variant || 'default'} asChild>
            {isExternal || link.newTab ? (
              <a
                href={link.url}
                target={link.newTab ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {icon}
                {link.label}
              </a>
            ) : (
              <Link href={link.url}>
                {icon}
                {link.label}
              </Link>
            )}
          </Button>
        )
      })}
    </div>
  )
}
