import { SeparatorBlock } from '@/payload-types'
import { cn } from '@/lib/utils'

const spacingClasses: Record<string, string> = {
  small: 'py-0',
  default: 'py-2',
  large: 'py-6',
}

const SeparatorBlockComponent: React.FC<SeparatorBlock> = ({ spacing }) => {
  return (
    <div className={cn('container-page', spacingClasses[spacing || 'default'])}>
      <div className="border-t border-border" />
    </div>
  )
}

export default SeparatorBlockComponent
