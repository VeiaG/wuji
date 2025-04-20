import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">УкрРанобе</h3>
            <p className="text-sm text-muted-foreground">
              Найменьша) українська платформа для читання ранобе. Відкрийте для себе світ японських,
              корейських та китайських новел українською мовою.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Навігація</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                  Головна
                </Link>
              </li>
              <li>
                <Link href="/novels" className="text-sm text-muted-foreground hover:text-primary">
                  Всі ранобе
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">
                  Блог
                </Link>
              </li>
              <li>
                <Link href="/latest" className="text-sm text-muted-foreground hover:text-primary">
                  Останні оновлення
                </Link>
              </li>
              <li>
                <Link href="/popular" className="text-sm text-muted-foreground hover:text-primary">
                  Популярні
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Жанри</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/genres/fantasy"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Фентезі
                </Link>
              </li>
              <li>
                <Link
                  href="/genres/action"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Бойовик
                </Link>
              </li>
              <li>
                <Link
                  href="/genres/romance"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Романтика
                </Link>
              </li>
              <li>
                <Link
                  href="/genres/adventure"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Пригоди
                </Link>
              </li>
              <li>
                <Link
                  href="/genres/drama"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Драма
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Інформація</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">
                  Про нас
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                  Контакти
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary">
                  Часті питання
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                  Умови використання
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                  Політика конфіденційності
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} УкрРанобе. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  )
}
