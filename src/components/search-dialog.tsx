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

  return {
    displayTitle,
    displayContent,
    hasContent: !!displayContent.trim(),
    hasMatchInTitle,
    hasMatchInDescription,
    matchQuality: hasMatchInTitle ? 'title' : hasMatchInDescription ? 'description' : 'none',
    coverImage,
    author,
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
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Пошук ранобе за назвою або описом..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[80dvh]">
        {isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">Шукаємо...</div>
        )}

        {!isLoading && query && (hits.length === 0 || !hits) && (
          <CommandEmpty>Нічого не знайдено для &quot;{query}&quot;</CommandEmpty>
        )}

        {!isLoading && error && (
          <div className="py-6 text-center text-sm text-red-600" role="alert">
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
                    author,
                  } = renderBookItem(hit, data)
                  const href = resolveBookURL(hit)

                  return (
                    <CommandItem
                      key={hit.objectID}
                      value={hit.objectID}
                      onSelect={() => handleSelect(hit)}
                      className="flex items-start gap-3 p-3"
                    >
                      {/* Cover Image */}
                      <div className="mt-0.5 flex-shrink-0">
                        {typeof coverImage === 'object' && coverImage?.url ? (
                          <Image
                            src={coverImage.url}
                            alt={coverImage.alt || ''}
                            width={48}
                            height={72}
                            className="rounded object-cover w-12 h-18"
                          />
                        ) : (
                          <div className="w-12 h-18 rounded bg-muted flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {displayTitle.includes('<') ? (
                            <span dangerouslySetInnerHTML={{ __html: displayTitle }} />
                          ) : (
                            displayTitle
                          )}
                        </div>

                        {/* Author */}
                        {typeof author === 'object' && author?.name && (
                          <div className="text-xs text-muted-foreground mt-0.5">{author.name}</div>
                        )}

                        {/* Content snippet */}
                        {hasContent && (
                          <div
                            className="text-sm text-muted-foreground line-clamp-2 mt-1"
                            dangerouslySetInnerHTML={{ __html: stripHTML(displayContent) }}
                          />
                        )}

                        {matchQuality === 'description' && !hasContent && (
                          <div className="text-xs text-blue-600 mt-1">Збіг в описі</div>
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
                      className="flex items-start gap-3 p-3"
                    >
                      <div className="mt-0.5 text-muted-foreground">
                        <Search className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
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

            <CommandSeparator />
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Натисніть Enter щоб відкрити результат. Cmd/Ctrl+K для закриття.
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
