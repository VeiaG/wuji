'use client'
import { Suspense } from 'react'
import { Sparkles } from 'lucide-react'
import type { Where } from 'payload'
import { BookCatalog } from '@/components/catalog/BookCatalog'

// Тільки авторські твори користувачів
const originWhere: Where = { origin: { equals: 'original' } }

// Обмежуємо поля, щоб не тягнути популяцію owner для кожної книги списку
const select = {
  title: true,
  slug: true,
  coverImage: true,
  genres: true,
  isAIAssisted: true,
} as const

function OriginalsPage() {
  return (
    <BookCatalog
      header={
        <>
          <h1 className="heading-display text-[32px] md:text-[44px]">Оригінали</h1>
          <p className="max-w-[640px] text-[15px] leading-relaxed text-soft md:text-base">
            Авторські твори наших користувачів — від коротких уривків до повноцінних історій. Вони
            зберігаються окремо від каталогу перекладів.
          </p>
        </>
      }
      originWhere={originWhere}
      noun={['твір', 'твори', 'творів']}
      errorNoun="твори"
      select={select}
      renderOverlay={(book) =>
        book.isAIAssisted && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-background/80 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="size-3" />
            ШІ
          </span>
        )
      }
    />
  )
}

// useSearchParams потребує Suspense-межі для статичного рендеру
export default function Page() {
  return (
    <Suspense>
      <OriginalsPage />
    </Suspense>
  )
}
