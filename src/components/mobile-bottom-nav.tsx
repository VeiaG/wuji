'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User, BookOpen, Settings } from 'lucide-react'
import { useAuth } from '@/providers/auth'
import { cn } from '@/lib/utils'

const MobileBottomNav = () => {
  const pathname = usePathname()
  const { user } = useAuth()

  // Hide on reading page (novel/[slug]/[page])
  const isReadingPage = pathname?.match(/^\/novel\/[^/]+\/[^/]+$/)
  if (isReadingPage) {
    return null
  }

  const navItems = [
    {
      label: 'Головна',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Новели',
      href: '/novels',
      icon: BookOpen,
      isActive: pathname?.startsWith('/novels'),
    },
    {
      label: 'Профіль',
      href: user?.slug ? `/profile/${user.slug}` : '/login',
      icon: User,
      isActive: pathname?.startsWith('/profile'),
    },
    {
      label: 'Налаштування',
      href: '/settings',
      icon: Settings,
      isActive: pathname?.startsWith('/settings'),
    },
  ]

  return (
    <>
      {/* Spacer to reserve space for the fixed nav - only on mobile */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Fixed bottom navigation */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'md:hidden', // Only show on mobile
          'bg-background/95 backdrop-blur-sm',
          'border-t border-border',
          'pb-[env(safe-area-inset-bottom)]', // iOS safe area
        )}
      >
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'w-full h-full',
                  'transition-colors duration-200',
                  'text-muted-foreground hover:text-foreground',
                  item.isActive && 'text-primary',
                )}
                aria-label={item.label}
              >
                <Icon
                  className={cn(
                    'w-6 h-6',
                    item.isActive && 'stroke-[2.5]', // Thicker stroke for active
                  )}
                />
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default MobileBottomNav
