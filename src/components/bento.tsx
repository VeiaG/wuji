import Link from 'next/link'
import { cn } from '@/lib/utils'

// Базові будівельні блоки bento-дизайну

export function Tile({
  className,
  size = 'lg',
  ...props
}: React.ComponentProps<'div'> & { size?: 'lg' | 'sm' }) {
  return (
    <div
      className={cn('bg-tile', size === 'lg' ? 'rounded-tile' : 'rounded-tile-sm', className)}
      {...props}
    />
  )
}

export function SectionHeader({
  title,
  href,
  linkLabel,
  as: Heading = 'h2',
  className,
}: {
  title: React.ReactNode
  href?: string
  linkLabel?: string
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2', className)}>
      <Heading className="heading-display text-[26px] md:text-[32px]">{title}</Heading>
      {href && (
        <Link href={href} className="text-[15px] font-semibold text-primary hover:opacity-90">
          {linkLabel ?? 'Усі'} →
        </Link>
      )}
    </div>
  )
}

/** Невелика підписана статистика всередині плитки */
export function StatTile({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  accent?: boolean
  className?: string
}) {
  return (
    <Tile size="sm" className={cn('flex flex-col gap-1 px-[22px] py-5', className)}>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={cn('font-display text-[28px] font-extrabold leading-tight', accent && 'text-primary')}>
        {value}
      </span>
      {hint && <span className="text-[13px] text-muted-foreground">{hint}</span>}
    </Tile>
  )
}

export function Chip({
  className,
  active,
  ...props
}: React.ComponentProps<'span'> & { active?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
        active ? 'bg-foreground text-background' : 'bg-tile text-soft hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('block h-1.5 w-full overflow-hidden rounded-full bg-chip', className)}>
      <span
        className="block h-full rounded-full bg-primary"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  )
}

/** Сітка обкладинок, як на макеті */
export function CoverGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 md:gap-y-[34px] lg:grid-cols-[repeat(auto-fill,minmax(170px,1fr))]',
        className,
      )}
      {...props}
    />
  )
}
