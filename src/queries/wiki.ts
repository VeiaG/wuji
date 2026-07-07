import { getPayload } from 'payload'
import config from '@payload-config'
import { cache } from 'react'
import { headers as getHeaders } from 'next/headers'

// Statuses visible on the frontend. 'review' and 'hidden' stay admin-only.
export const VISIBLE_WIKI_STATUSES = ['auto', 'published'] as const

/**
 * An item is a spoiler when its chapter number is beyond the reader's progress.
 * Items without a chapter number are always safe.
 */
export const isSpoiler = (
  chapterIndex: number | null | undefined,
  readerProgress: number,
): boolean => typeof chapterIndex === 'number' && chapterIndex > readerProgress

// Used on the book page to decide whether to show the wiki button at all.
export const queryHasWiki = cache(async ({ bookId }: { bookId: string }) => {
  const payload = await getPayload({ config })

  const { totalDocs } = await payload.count({
    collection: 'wikiEntries',
    where: {
      novel: { equals: bookId },
      status: { in: [...VISIBLE_WIKI_STATUSES] },
    },
  })

  return totalDocs > 0
})

/**
 * Reader's saved progress (1-based chapter number) for spoiler gating.
 * Anonymous users and users without progress get 0 — everything with a
 * spoiler chapter is hidden until they toggle spoilers on.
 */
export const queryWikiReaderProgress = cache(async ({ bookId }: { bookId: string }) => {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  if (!user) return 0

  const result = await payload.find({
    collection: 'readProgress',
    limit: 1,
    pagination: false,
    where: {
      user: { equals: user.id },
      book: { equals: bookId },
    },
    select: {
      chapter: true,
    },
  })

  return result.docs?.[0]?.chapter ?? 0
})

// All visible entries of a book, for the wiki index page. Spoiler filtering
// happens in the page — it also needs the count of hidden entries.
export const queryWikiEntriesByBook = cache(async ({ bookId }: { bookId: string }) => {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'wikiEntries',
    where: {
      novel: { equals: bookId },
      status: { in: [...VISIBLE_WIKI_STATUSES] },
    },
    pagination: false,
    limit: 2000,
    sort: 'title',
    depth: 1,
    select: {
      title: true,
      slug: true,
      type: true,
      shortDescription: true,
      image: true,
      firstAppearanceIndex: true,
      spoilerChapterIndex: true,
      status: true,
    },
  })

  return result.docs
})

/**
 * One entry with its evidence (mentions) and graph edges (relations).
 * Mentions/relations are admin-only via REST — the local API overrides
 * access, so the page must apply spoiler filtering itself.
 */
export const queryWikiEntry = cache(
  async ({ bookId, entrySlug }: { bookId: string; entrySlug: string }) => {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'wikiEntries',
      limit: 1,
      pagination: false,
      depth: 1,
      joins: false,
      where: {
        novel: { equals: bookId },
        slug: { equals: entrySlug },
        status: { in: [...VISIBLE_WIKI_STATUSES] },
      },
    })

    const entry = result.docs?.[0]
    if (!entry) return null

    const [mentions, outgoing, incoming] = await Promise.all([
      payload.find({
        collection: 'wikiMentions',
        where: { entry: { equals: entry.id } },
        sort: 'chapterIndex',
        pagination: false,
        limit: 1000,
        depth: 0,
      }),
      payload.find({
        collection: 'wikiRelations',
        where: { sourceEntry: { equals: entry.id } },
        pagination: false,
        limit: 500,
        depth: 1,
      }),
      payload.find({
        collection: 'wikiRelations',
        where: { targetEntry: { equals: entry.id } },
        pagination: false,
        limit: 500,
        depth: 1,
      }),
    ])

    return {
      entry,
      mentions: mentions.docs,
      outgoingRelations: outgoing.docs,
      incomingRelations: incoming.docs,
    }
  },
)
