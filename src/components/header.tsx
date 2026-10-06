'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Menu, X, Settings, Bell } from 'lucide-react'
import { useState, useContext } from 'react'
import UserNav from './user-nav'
import { Logo } from './logo'
import { SearchDialogContext } from '@/components/search-dialog'
import { useNotificationsContext } from '@/components/NotificationsProvider'
import { useAuth } from '@/providers/auth'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Головна' },
  { href: '/novels', label: 'Всі ранобе' },
  { href: '/originals', label: 'Оригінали' },
  { href: '/blog', label: 'Блог' },
  { href: '/about', label: 'Про нас' },
]

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

const iconTile =
  'relative grid size-11 shrink-0 place-items-center rounded-[14px] bg-tile text-foreground transition-colors hover:bg-chip'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const searchDialog = useContext(SearchDialogContext)
  const pathname = usePathname()
  const { user } = useAuth()
  const { unreadCount } = useNotificationsContext()

  // Читалка має власний хедер
  if (/^\/novel\/[^/]+\/[^/]+$/.test(pathname) && !pathname.endsWith('/editor')) return null

  const closeMenu = () => setIsMenuOpen(false)
  const openSearch = () => searchDialog?.setOpen(true)

  const notificationsLink = user && (
    <Link
      href="/notifications"
      className={iconTile}
      aria-label={
        unreadCount > 0
          ? `Сповіщення, ${unreadCount > 9 ? '9+' : unreadCount} непрочитаних`
          : 'Сповіщення'
      }
    >
      <Bell className="size-[18px]" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )

  return (
    <header className="relative z-50">
      <div className="container-page flex items-center gap-4 py-4 md:gap-7 md:py-[18px]">
        <Logo onClick={closeMenu} />

        <nav className="hidden lg:flex items-center gap-[22px] text-[15px] font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
              className={cn(
                'transition-colors hover:text-foreground',
                isActive(pathname, link.href) ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="flex-1" />

        {/* Поле пошуку — відкриває діалог */}
        <button
          type="button"
          onClick={openSearch}
          className="hidden md:flex min-h-11 flex-[0_1_280px] items-center gap-2 rounded-[14px] bg-tile px-3.5 text-[15px] text-muted-foreground transition-colors hover:bg-chip cursor-pointer"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Знайти ранобе</span>
          <kbd className="hidden xl:inline rounded-md bg-chip px-1.5 py-0.5 text-[11px] font-semibold">
            Ctrl K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          <button type="button" onClick={openSearch} className={cn(iconTile, 'md:hidden')} aria-label="Пошук">
            <Search className="size-[18px]" />
          </button>
          {notificationsLink}
          <Link href="/settings" className={cn(iconTile, 'hidden md:grid')} aria-label="Налаштування">
            <Settings className="size-[18px]" />
          </Link>
          <div className="hidden md:flex items-center gap-2">
            <UserNav />
          </div>
          <button
            type="button"
            className={cn(iconTile, 'lg:hidden')}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="container-page absolute inset-x-0 top-full lg:hidden">
          <nav className="flex flex-col gap-1 rounded-tile-sm bg-tile p-3 shadow-float">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={cn(
                  'rounded-xl px-3 py-3 text-[15px] font-medium transition-colors hover:bg-chip',
                  isActive(pathname, link.href) ? 'text-foreground' : 'text-soft',
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/settings"
              onClick={closeMenu}
              className="rounded-xl px-3 py-3 text-[15px] font-medium text-soft transition-colors hover:bg-chip md:hidden"
            >
              Налаштування
            </Link>
            <div className="mt-2 flex items-center gap-2 border-t pt-3 md:hidden" onClick={closeMenu}>
              <UserNav />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
