'use client'
import { useState } from 'react'
import { Input } from './ui/input'
import { Search } from 'lucide-react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useRouter } from '@bprogress/next/app'
import { Button } from './ui/button'

const SearchInput = () => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const [search, setSearch] = useState(searchParams.get('search')?.toString() || '')

  function handleSearch(query: string) {
    const params = new URLSearchParams(searchParams)
    if (query) {
      params.set('search', query)
    } else {
      params.delete('search')
    }
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="w-full flex items-center gap-2 justify-between">
      <div className="relative w-full grow">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук"
          className="w-full pl-8"
        />
      </div>
      <Button variant="outline" onClick={() => handleSearch(search)}>
        Пошук
      </Button>
    </div>
  )
}

export default SearchInput
