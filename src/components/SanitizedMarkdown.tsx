import { cn } from '@/lib/utils'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Options } from 'rehype-sanitize'
import { Streamdown } from 'streamdown'

export const sanitizeSchema: Options = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []).filter(
      (tag) => !['img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'code', 'pre'].includes(tag),
    ),
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ['href', /^https:\/\/wuji\.world/], // тільки посилання на твій сайт
      'rel',
      'target',
    ],
  },
}

//Unified heading component for h1 to h5, to apply same styles easily
const headingComponent = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => <h4 className={cn('font-bold text-xl', className)}>{children}</h4>

export function SanitizedMarkdown({ content, className }: { content: string; className?: string }) {
  return (
    <Streamdown
      className={cn(className)}
      rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      components={{
        h1: ({ children, className }) => headingComponent({ children, className }),
        h2: ({ children, className }) => headingComponent({ children, className }),
        h3: ({ children, className }) => headingComponent({ children, className }),
        h4: ({ children, className }) => headingComponent({ children, className }),
        h5: ({ children, className }) => headingComponent({ children, className }),
      }}
      mode="static"
    >
      {content}
    </Streamdown>
  )
}
