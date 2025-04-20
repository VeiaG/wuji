'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold">
            УкрРанобе
          </Link>
        </div>

        {/* Мобільне меню */}
        <Button
          className="md:hidden"
          variant={'ghost'}
          size="icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Десктопне меню */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Головна
          </Link>
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Всі ранобе
          </Link>
          <Link href="/blog" className="text-sm font-medium hover:text-primary">
            Блог
          </Link>
          <Link href="/latest" className="text-sm font-medium hover:text-primary">
            Останні оновлення
          </Link>
          <Link href="/popular" className="text-sm font-medium hover:text-primary">
            Популярні
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Пошук">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="outline">Увійти</Button>
          <Button>Реєстрація</Button>
        </div>

        {/* Мобільне меню (відкрите) */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 z-50 bg-background border-b p-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-sm font-medium hover:text-primary">
                Головна
              </Link>
              <Link href="/" className="text-sm font-medium hover:text-primary">
                Всі ранобе
              </Link>
              <Link href="/blog" className="text-sm font-medium hover:text-primary">
                Блог
              </Link>
              <Link href="/latest" className="text-sm font-medium hover:text-primary">
                Останні оновлення
              </Link>
              <Link href="/popular" className="text-sm font-medium hover:text-primary">
                Популярні
              </Link>
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button variant="ghost" size="icon" aria-label="Пошук">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="outline" className="flex-1">
                  Увійти
                </Button>
                <Button className="flex-1">Реєстрація</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
