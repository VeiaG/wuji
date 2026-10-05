'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { Search, BookOpen } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { stringify } from 'qs-esm'
import { Book, Author, Media } from '@/payload-types'
import Image from 'next/image'

type HighlightValue = { value: string; matchLevel?: string }

type AlgoliaHit = {
  objectID: string
  collection?: string
  title?: string
  alternativeNames?: string[]
  description?: string
  slug?: string
  coverImage?: string | Media
  author?: string | Author
  _highlightResult?: {
    title?: HighlightValue
    alternativeNames?: HighlightValue
    description?: HighlightValue
  }
  _snippetResult?: {
    description?: HighlightValue
    alternativeNames?: HighlightValue
  }
  //eslint-disable-next-line
  [key: string]: any
}

type SearchResponse = {
  hits: AlgoliaHit[]
  nbHits: number
  page?: number
  enrichedHits?: Record<string, Book>
  //eslint-disable-next-line
  [key: string]: any
}

function stripHTML(html?: string) {
  if (!html) return ''
  const tmp = typeof window !== 'undefined' ? document.createElement('div') : null
  if (!tmp) return html.replace(/<[^>]*>/g, '')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

// Helper to check if content has meaningful highlights
function hasHighlights(highlightResult?: HighlightValue) {
  return highlightResult?.matchLevel === 'full' || highlightResult?.matchLevel === 'partial'
}

// Helper to get the best available content (snippet preferred over full highlight)
function getBestContent(
  snippetResult?: HighlightValue,
  highlightResult?: HighlightValue,
  rawContent?: string,
) {
  if (snippetResult?.value) return snippetResult.value
  if (highlightResult?.value && hasHighlights(highlightResult)) return highlightResult.value
  return rawContent || ''
}

function buildQueryString(q: string) {
  const params = {
    query: q,
    hitsPerPage: 10,
    enrichResults: true,
    getRankingInfo: true,
    attributesToHighlight: ['title', 'description'],
    attributesToSnippet: ['description:32'],
    depth: {
      books: 2,
    },
    select: {
      books: {
        slug: true,
        title: true,
        coverImage: true,
        author: true,
        origin: true,
        owner: true,
      },
    },
  }

  return stringify(params)
}

function renderBookItem(hit: AlgoliaHit, data: SearchResponse | null) {
  const titleHighlight = hit._highlightResult?.title
  const descriptionHighlight = hit._highlightResult?.description
  const descriptionSnippet = hit._snippetResult?.description

  // Use highlighted title if it has highlights, otherwise raw title
  const displayTitle =
    titleHighlight && hasHighlights(titleHighlight) ? titleHighlight.value : hit.title || ''

  // Get the best content representation - show description snippet
  const displayContent = getBestContent(descriptionSnippet, descriptionHighlight, hit.description)

  const hasMatchInTitle = hasHighlights(titleHighlight)
  const hasMatchInDescription =
    hasHighlights(descriptionHighlight) || hasHighlights(descriptionSnippet)

  const enriched = data?.enrichedHits?.[hit.objectID]
  const coverImage = enriched?.coverImage || hit.coverImage
  const author = enriched?.author || hit.author
  // Для оригіналів автором є користувач-власник
  const owner = enriched?.origin === 'original' ? enriched?.owner : undefined
  const authorName =
    (typeof owner === 'object' && owner?.nickname) ||
    (typeof author === 'object' ? author?.name : undefined) ||
    undefined

  return {
    displayTitle,
    displayContent,
    hasContent: !!displayContent.trim(),
    hasMatchInTitle,
    hasMatchInDescription,
    matchQuality: hasMatchInTitle ? 'title' : hasMatchInDescription ? 'description' : 'none',
    coverImage,
    authorName,
  }
}

export function useDebouncedSearch() {
  const [query, setQueryState] = useState('')
  const [data, setData] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setData(null)
      setError(null)
      setLoading(false)
      setPending(false)
      return
    }

    setLoading(true)
    setError(null)
    setPending(false)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const currentRequestId = ++requestIdRef.current

    try {
      const qs = buildQueryString(q)
      const res = await fetch(`/api/search?${qs}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Помилка пошуку')
      }

      const json = (await res.json()) as SearchResponse
      if (currentRequestId === requestIdRef.current) {
        setData(json)
        setError(null)
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      if (currentRequestId === requestIdRef.current) {
        setError(e instanceof Error ? e.message : 'Помилка пошуку')
        setData(null)
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q)
      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (q.trim()) {
        setPending(true)
        debounceRef.current = setTimeout(() => doSearch(q), 700) // 700ms debounce
      } else {
        setPending(false)
        setData(null)
        setError(null)
      }
    },
    [doSearch],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      abortRef.current?.abort()
    }
  }, [])

  return { query, setQuery, data, error, loading, pending }
}

function SearchDialog() {
  const router = useRouter()
  const { query, setQuery, loading, pending, data, error } = useDebouncedSearch()
  const isLoading = loading || pending

  const context = useContext(SearchDialogContext)
  if (!context) {
    throw new Error('SearchDialog must be used within a SearchDialogProvider')
  }
  const { open, setOpen } = context

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key?.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setOpen])

  const hits = useMemo(() => data?.hits ?? [], [data])

  const grouped = useMemo(() => {
    const groups: Record<string, AlgoliaHit[]> = {
      books: [],
      other: [],
    }
    for (const h of hits) {
      const key = h.collection && groups[h.collection] ? h.collection : 'other'
      groups[key].push(h)
    }
    return groups
  }, [hits])

  function resolveBookURL(hit: AlgoliaHit) {
    const enriched = data?.enrichedHits?.[hit.objectID]
    const slug = enriched?.slug || hit.slug
    if (slug) return `/novel/${slug}`
    return null
  }

  function handleSelect(hit: AlgoliaHit) {
    const href = resolveBookURL(hit)
    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={false}
      title="Пошук"
      description="Пошук ранобе за назвою або описом"
      className="gap-0 sm:max-w-[640px] **:data-[slot=command-input-wrapper]:h-14 **:data-[slot=command-input-wrapper]:px-4 **:data-[slot=command-input-wrapper]:pr-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[13px] [&_[cmdk-group-heading]]:font-semibold"
    >
      <CommandInput
        placeholder="Пошук ранобе за назвою або описом..."
        value={query}
        onValueChange={setQuery}
        className="h-14 text-base md:text-base"
      />
      <CommandList className="max-h-[min(70dvh,560px)] pb-2">
        {!query && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Почніть вводити назву ранобе
          </div>
        )}

        {isLoading && (
          <div className="py-8 text-center text-sm text-muted-foreground">Шукаємо...</div>
        )}

        {!isLoading && query && (hits.length === 0 || !hits) && (
          <CommandEmpty>Нічого не знайдено для &quot;{query}&quot;</CommandEmpty>
        )}

        {!isLoading && error && (
          <div className="py-6 text-center text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        {!isLoading && hits.length > 0 && (
          <>
            {grouped['books'].length > 0 && (
              <CommandGroup heading={`Книги (${grouped['books'].length})`}>
                {grouped['books'].map((hit) => {
                  const {
                    displayTitle,
                    displayContent,
                    hasContent,
                    matchQuality,
                    coverImage,
                    authorName,
                  } = renderBookItem(hit, data)
                  // const href = resolveBookURL(hit)

                  return (
                    <CommandItem
                      key={hit.objectID}
                      value={hit.objectID}
                      onSelect={() => handleSelect(hit)}
                      className="flex items-start gap-3 rounded-2xl p-2.5 data-[selected=true]:bg-chip"
                    >
                      {/* Cover Image */}
                      <div className="flex-shrink-0">
                        {typeof coverImage === 'object' && coverImage?.url ? (
                          <Image
                            src={coverImage.url}
                            alt={coverImage.alt || ''}
                            width={48}
                            height={72}
                            className="h-[72px] w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-[72px] w-12 items-center justify-center rounded-lg bg-chip">
                            <BookOpen className="size-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="truncate text-[15px] font-bold [&_em]:text-primary [&_em]:not-italic">
                          {displayTitle.includes('<') ? (
                            <span dangerouslySetInnerHTML={{ __html: displayTitle }} />
                          ) : (
                            displayTitle
                          )}
                        </div>

                        {/* Author */}
                        {authorName && (
                          <div className="mt-0.5 text-[13px] text-muted-foreground">{authorName}</div>
                        )}

                        {/* Content snippet */}
                        {hasContent && (
                          <div
                            className="mt-1 line-clamp-2 text-[13px] leading-snug text-soft"
                            dangerouslySetInnerHTML={{ __html: stripHTML(displayContent) }}
                          />
                        )}

                        {matchQuality === 'description' && !hasContent && (
                          <div className="mt-1 text-xs text-primary">Збіг в описі</div>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {grouped['other'].length > 0 && (
              <CommandGroup heading={`Інше (${grouped['other'].length})`}>
                {grouped['other'].map((hit) => {
                  const titleHighlight = hit._highlightResult?.title
                  const title =
                    titleHighlight && hasHighlights(titleHighlight)
                      ? titleHighlight.value
                      : hit.title || ''

                  return (
                    <CommandItem
                      key={hit.objectID}
                      value={hit.objectID}
                      onSelect={() => handleSelect(hit)}
                      className="flex items-center gap-3 rounded-2xl p-2.5 data-[selected=true]:bg-chip"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-chip">
                        <Search className="size-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-bold [&_em]:text-primary [&_em]:not-italic">
                          {title.includes('<') ? (
                            <span dangerouslySetInnerHTML={{ __html: title }} />
                          ) : (
                            title
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            <CommandSeparator className="mx-0 mt-1" />
            <div className="hidden px-4 pt-2.5 text-xs text-muted-foreground md:block">
              Enter — відкрити результат, Ctrl/Cmd+K — закрити.
            </div>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

interface SearchDialogContextValue {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const SearchDialogContext = createContext<SearchDialogContextValue>({
  open: false,
  setOpen: () => {},
})

export const SearchDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <SearchDialogContext.Provider value={{ open, setOpen }}>
      <SearchDialog />
      {children}
    </SearchDialogContext.Provider>
  )
}
