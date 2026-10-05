import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="ВуЧи — на головну"
      className={cn('font-display text-[22px] font-extrabold tracking-[-0.02em] leading-none', className)}
    >
      ву<span className="text-primary">чи</span>
    </Link>
  )
}
