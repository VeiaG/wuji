import { SeparatorBlock } from '@/payload-types'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const spacingClasses: Record<string, string> = {
  small: 'py-2',
  default: 'py-6',
  large: 'py-12',
}

const SeparatorBlockComponent: React.FC<SeparatorBlock> = ({ spacing }) => {
  return (
    <div className={cn('container mx-auto px-4 max-w-4xl', spacingClasses[spacing || 'default'])}>
      <Separator />
    </div>
  )
}

export default SeparatorBlockComponent
