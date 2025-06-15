'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Menu, X } from 'lucide-react'
import { useState } from 'react'
import UserNav from './user-nav'
import ThemeSwitcher from './theme-switcher'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto flex h-16 items-center">
        <div className="flex items-center gap-2 lg:mr-12">
          <Link href="/" className="text-xl font-bold">
            ВуЧи
          </Link>
          <span className="text-xs text-muted-foreground self-end select-none">alpha</span>
        </div>

        {/* Мобільне меню */}
        <Button
          className="md:hidden ml-auto"
          variant={'ghost'}
          size="icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Десктопне меню */}
        <nav className="hidden md:flex items-center gap-6 mr-auto">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Головна
          </Link>
          <Link href="/novels" className="text-sm font-medium hover:text-primary">
            Всі ранобе
          </Link>
          <Link href="/blog" className="text-sm font-medium hover:text-primary">
            Блог
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary">
            Про нас
          </Link>
          <Button variant="ghost" size="icon" aria-label="Пошук">
            <Search className="h-5 w-5" />
          </Button>
        </nav>

        <div className="hidden md:flex items-center gap-2 min-w-[256px] justify-end">
          <UserNav />
          <ThemeSwitcher />
        </div>

        {/* Мобільне меню (відкрите) */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 z-50 bg-background border-b p-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-sm font-medium hover:text-primary" onClick={closeMenu}>
                Головна
              </Link>
              <Link
                href="/novels"
                className="text-sm font-medium hover:text-primary"
                onClick={closeMenu}
              >
                Всі ранобе
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium hover:text-primary"
                onClick={closeMenu}
              >
                Блог
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium hover:text-primary"
                onClick={closeMenu}
              >
                Про нас
              </Link>
              <Button variant="ghost" size="icon" aria-label="Пошук" onClick={closeMenu}>
                <Search className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 pt-4 border-t" onClick={closeMenu}>
                <UserNav />
                <ThemeSwitcher />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
