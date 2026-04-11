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
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
}) => (
  <Link
    href={href}
    className={cn(
      'flex flex-col items-center justify-center gap-1',
      'w-full h-full',
      'transition-colors duration-200',
      'text-muted-foreground hover:text-foreground',
      isActive && 'text-primary',
    )}
    aria-label={label}
  >
    <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
    <span className="text-[10px] leading-none">{label}</span>
  </Link>
)

const MobileBottomNav = () => {
  const pathname = usePathname()
  const { user } = useAuth()
  const { unreadCount } = useNotificationsContext()

  // Hide on reading page
  if (pathname?.match(/^\/novel\/[^/]+\/[^/]+$/)) return null

  return (
    <>
      {/* Spacer */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'md:hidden',
          'bg-background/95 backdrop-blur-sm',
          'border-t border-border',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="flex items-center h-16 px-2">
          {/* Головна */}
          <NavItem
            href="/"
            icon={Home}
            label="Головна"
            isActive={pathname === '/'}
          />

          {/* Каталог */}
          <NavItem
            href="/novels"
            icon={BookOpen}
            label="Каталог"
            isActive={!!pathname?.startsWith('/novels')}
          />

          {/* Центральна — Бібліотека */}
          <div className="flex items-center justify-center w-full h-full">
            <Link
              href="/library"
              aria-label="Бібліотека"
              className={cn(
                'flex flex-col items-center justify-center gap-1',
                'w-14 h-14 rounded-full',
                'bg-primary text-primary-foreground',
                'shadow-lg shadow-primary/30',
                'transition-transform duration-200 active:scale-95',
                '-mt-5',
              )}
            >
              <Library className="w-6 h-6" />
              <span className="text-[9px] leading-none font-medium">Читаю</span>
            </Link>
          </div>

          {/* Сповіщення */}
          <div className="relative flex items-center justify-center w-full h-full">
            <Link
              href="/notifications"
              aria-label="Сповіщення"
              className={cn(
                'flex flex-col items-center justify-center gap-1',
                'w-full h-full',
                'transition-colors duration-200',
                'text-muted-foreground hover:text-foreground',
                pathname?.startsWith('/notifications') && 'text-primary',
              )}
            >
              <div className="relative">
                <Bell
                  className={cn(
                    'w-5 h-5',
                    pathname?.startsWith('/notifications') && 'stroke-[2.5]',
                  )}
                />
                {user && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-none">Сповіщення</span>
            </Link>
          </div>

          {/* Профіль */}
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
