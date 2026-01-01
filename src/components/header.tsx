'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Menu, X, Settings } from 'lucide-react'
import { useState, useContext } from 'react'
import UserNav from './user-nav'
import { SearchDialogContext } from '@/components/search-dialog'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const searchDialog = useContext(SearchDialogContext)

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const openSearch = () => {
    searchDialog?.setOpen(true)
  }

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto flex h-16 items-center">
          <div className="flex items-center gap-2 lg:mr-12">
            <Link href="/" className="text-xl font-bold">
              ВуЧи
            </Link>
            <span className="text-xs text-muted-foreground self-end select-none">
              {process.env.NEXT_PUBLIC_GIT_TAG || 'alpha'}
            </span>
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
            <Button variant="ghost" size="icon" aria-label="Пошук" onClick={openSearch}>
              <Search className="h-5 w-5" />
            </Button>
          </nav>

          <div className="hidden md:flex items-center gap-2 min-w-[256px] justify-end">
            <UserNav />
            <Button asChild size="icon" variant="outline">
              <Link href="/settings">
                <Settings />
              </Link>
            </Button>
          </div>

          {/* Мобільне меню (відкрите) */}
          {isMenuOpen && (
            <div className="absolute top-16 left-0 right-0 z-50 bg-background border-b p-4 md:hidden">
              <nav className="flex flex-col gap-4">
                <Link
                  href="/"
                  className="text-sm font-medium hover:text-primary"
                  onClick={closeMenu}
                >
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
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Пошук"
                  onClick={() => {
                    closeMenu()
                    openSearch()
                  }}
                >
                  <Search className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2 pt-4 border-t" onClick={closeMenu}>
                  <UserNav />
                  <Button asChild size="icon" variant="outline">
                    <Link href="/settings">
                      <Settings />
                    </Link>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
