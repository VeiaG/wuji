import { SeparatorBlock } from '@/payload-types'
import { cn } from '@/lib/utils'

const spacingClasses: Record<string, string> = {
  small: 'py-2',
  default: 'py-6',
  large: 'py-12',
}

const SeparatorBlockComponent: React.FC<SeparatorBlock> = ({ spacing }) => {
  return (
    <div className={cn('container-page', spacingClasses[spacing || 'default'])}>
      <div className="border-t border-border" />
    </div>
  )
}

export default SeparatorBlockComponent
