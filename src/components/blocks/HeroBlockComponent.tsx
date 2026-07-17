import { HeroBlock } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import BlockBackground from './BlockBackground'
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
  return (
    <section className="relative isolate overflow-hidden py-12 border-b border-border/20">
      <BlockBackground image={backgroundImage} />
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <BlockIcon icon={icon} className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">{heading}</h1>
          </div>
          {subheading && <p className="text-xl text-muted-foreground">{subheading}</p>}
          {badges && badges.length > 0 && (
            <div className="flex justify-center gap-2 flex-wrap">
              {badges.map((badge) => (
                <Badge
                  key={badge.id || badge.label}
                  variant={badge.variant || 'secondary'}
                  className="flex items-center gap-1"
                >
                  <BlockIcon icon={badge.icon} className="h-3 w-3" />
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
          <BlockLinks links={links} className="justify-center" />
        </div>
      </div>
    </section>
  )
}

export default HeroBlockComponent
