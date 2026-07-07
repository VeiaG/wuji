'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import {
  ENTRY_TYPE_LABELS,
  ENTRY_TYPE_ORDER,
  type WikiEntryType,
} from '@/components/wiki/wiki-labels'

export type WikiExplorerEntry = {
  id: string
  title: string
  slug: string
  type: WikiEntryType
  shortDescription?: string | null
  imageUrl?: string | null
  firstAppearanceIndex?: number | null
  isAuto: boolean
}

type Props = {
  entries: WikiExplorerEntry[]
  bookSlug: string
  spoilersShown: boolean
}

const WikiExplorer = ({ entries, bookSlug, spoilersShown }: Props) => {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<WikiEntryType | 'all'>('all')

  const typeCounts = useMemo(() => {
    const counts = new Map<WikiEntryType, number>()
    for (const entry of entries) {
      counts.set(entry.type, (counts.get(entry.type) || 0) + 1)
    }
    return counts
  }, [entries])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (activeType !== 'all' && entry.type !== activeType) return false
      if (!query) return true
      return (
        entry.title.toLowerCase().includes(query) ||
        (entry.shortDescription || '').toLowerCase().includes(query)
      )
    })
  }, [entries, search, activeType])

  const groups = useMemo(() => {
    return ENTRY_TYPE_ORDER.map((type) => ({
      type,
      entries: filtered
        .filter((entry) => entry.type === type)
        .sort((a, b) => a.title.localeCompare(b.title, 'uk')),
    })).filter((group) => group.entries.length > 0)
  }, [filtered])

  const entryHref = (slug: string) =>
    `/novel/${bookSlug}/wiki/${slug}${spoilersShown ? '?spoilers=1' : ''}`

  return (
    <div className="space-y-6">
      {/* Search + type filter */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук у вікі..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => setActiveType('all')}>
            <Badge
              variant={activeType === 'all' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
            >
              Усі ({entries.length})
            </Badge>
          </button>
          {ENTRY_TYPE_ORDER.map((type) => {
            const count = typeCounts.get(type)
            if (!count) return null
            const { plural, icon: Icon } = ENTRY_TYPE_LABELS[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(activeType === type ? 'all' : type)}
              >
                <Badge
                  variant={activeType === type ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1"
                >
                  <Icon />
                  {plural} ({count})
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground py-8 text-center">Нічого не знайдено.</p>
      )}

      {/* Grouped sections */}
      {groups.map(({ type, entries: groupEntries }) => {
        const { plural, icon: Icon } = ENTRY_TYPE_LABELS[type]
        return (
          <section key={type}>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Icon className="size-5 text-muted-foreground" />
              {plural}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={entryHref(entry.slug)}
                  className={cn(
                    'flex gap-3 rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3',
                    'hover:border-border hover:bg-accent/40 transition-colors',
                  )}
                >
                  {entry.imageUrl ? (
                    <Image
                      src={entry.imageUrl}
                      alt={entry.title}
                      width={56}
                      height={56}
                      className="size-14 rounded-md object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Icon className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{entry.title}</span>
                      {entry.isAuto && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                          ШІ
                        </Badge>
                      )}
                    </div>
                    {entry.shortDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.shortDescription}
                      </p>
                    )}
                    {entry.firstAppearanceIndex && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        з розділу {entry.firstAppearanceIndex}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default WikiExplorer
