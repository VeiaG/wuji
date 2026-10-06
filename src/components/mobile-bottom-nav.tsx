'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Library, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationsContext } from '@/components/NotificationsProvider'
import { useAuth } from '@/providers/auth'

const NavItem = ({
  href,
  icon: Icon,
  label,
  isActive,
  badge,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
}) => (
  <Link
    href={href}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-1.5',
      'transition-colors duration-200',
      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
    )}
  >
    <span className="relative">
      <Icon className={cn('size-5', isActive && 'stroke-[2.4]')} />
      {!!badge && badge > 0 && (
        <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground ring-2 ring-tile">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </span>
    <span className="text-[10px] font-semibold leading-none">{label}</span>
  </Link>
)

const MobileBottomNav = () => {
  const pathname = usePathname()
  const { user } = useAuth()
  const { unreadCount } = useNotificationsContext()

  // На сторінці читання своя панель
  if (pathname?.match(/^\/novel\/[^/]+\/[^/]+$/)) return null

  return (
    <>
      {/* Spacer */}
      <div className="h-24 md:hidden" aria-hidden="true" />

      <nav
        aria-label="Основна навігація"
        className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 md:hidden"
      >
        <div className="flex items-stretch gap-1 rounded-[24px] bg-tile p-1.5 shadow-float">
          <NavItem href="/" icon={Home} label="Головна" isActive={pathname === '/'} />
          <NavItem
            href="/novels"
            icon={BookOpen}
            label="Каталог"
            isActive={!!pathname?.startsWith('/novels') || !!pathname?.startsWith('/originals')}
          />
          <NavItem
            href="/library"
            icon={Library}
            label="Читаю"
            isActive={!!pathname?.startsWith('/library')}
          />
          <NavItem
            href={user ? '/notifications' : '/login'}
            icon={Bell}
            label="Сповіщення"
            isActive={!!pathname?.startsWith('/notifications')}
            badge={user ? unreadCount : 0}
          />
          <NavItem
            href="/profile"
            icon={User}
            label="Профіль"
            isActive={!!pathname?.startsWith('/profile')}
          />
        </div>
      </nav>
    </>
  )
}

export default MobileBottomNav
