'use client'
import { Suspense, useContext } from 'react'
import { Search } from 'lucide-react'
import type { Where } from 'payload'
import { BookCatalog } from '@/components/catalog/BookCatalog'
import { SearchDialogContext } from '@/components/search-dialog'

// Авторські оригінали живуть на окремій сторінці /originals
const originWhere: Where = { origin: { not_equals: 'original' } }

function NovelsPage() {
  const searchDialog = useContext(SearchDialogContext)

  return (
    <BookCatalog
      header={<h1 className="heading-display text-[32px] md:text-[44px]">Усі ранобе</h1>}
      originWhere={originWhere}
      noun={['книга', 'книги', 'книг']}
      toolbarEnd={
        <button
          type="button"
          onClick={() => searchDialog?.setOpen(true)}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-tile px-4 text-left text-[15px] text-muted-foreground transition-colors hover:text-foreground sm:w-[320px] cursor-pointer"
        >
          <Search className="size-[18px] shrink-0" />
          Пошук ранобе...
        </button>
      }
    />
  )
}

// useSearchParams потребує Suspense-межі для статичного рендеру
export default function Page() {
  return (
    <Suspense>
      <NovelsPage />
    </Suspense>
  )
}
