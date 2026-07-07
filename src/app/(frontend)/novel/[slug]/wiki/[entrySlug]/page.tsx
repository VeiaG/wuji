import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ArrowLeft, Bot, Eye, EyeOff, Quote } from 'lucide-react'
import type { WikiEntry, WikiRelation } from '@/payload-types'
import { queryBookBySlug } from '@/queries'
import { isSpoiler, queryWikiEntry, queryWikiReaderProgress } from '@/queries/wiki'
import {
  ENTRY_TYPE_LABELS,
  MENTION_TYPE_LABELS,
  RELATION_TYPE_LABELS,
} from '@/components/wiki/wiki-labels'
import SpoilerToggle from '@/components/wiki/spoiler-toggle'
import RichText from '@/components/RichText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Args = {
  params: Promise<{ slug?: string; entrySlug?: string }>
  searchParams: Promise<{ spoilers?: string }>
}

type RelatedItem = {
  relationId: string
  other: WikiEntry
  chapterIndex?: number | null
  ended: boolean
}

/**
 * Merge outgoing and incoming edges into label → related entries.
 * A related entry is hidden while either the edge's evidence chapter or the
 * other entry's own spoiler chapter is beyond the reader's progress.
 */
const groupRelations = ({
  outgoing,
  incoming,
  readerProgress,
  spoilersShown,
}: {
  outgoing: WikiRelation[]
  incoming: WikiRelation[]
  readerProgress: number
  spoilersShown: boolean
}) => {
  const groups = new Map<string, RelatedItem[]>()
  let hidden = 0

  const add = (relation: WikiRelation, direction: 'out' | 'in') => {
    const other = direction === 'out' ? relation.targetEntry : relation.sourceEntry
    if (typeof other !== 'object') return
    if (other.status !== 'auto' && other.status !== 'published') return

    const gated =
      isSpoiler(relation.chapterIndex, readerProgress) ||
      isSpoiler(other.spoilerChapterIndex, readerProgress)
    if (gated && !spoilersShown) {
      hidden++
      return
    }

    const label = RELATION_TYPE_LABELS[relation.type][direction]
    const list = groups.get(label) || []
    list.push({
      relationId: relation.id,
      other,
      chapterIndex: relation.chapterIndex,
      ended: relation.state === 'ended',
    })
    groups.set(label, list)
  }

  outgoing.forEach((relation) => add(relation, 'out'))
  incoming.forEach((relation) => add(relation, 'in'))

  return { groups, hidden }
}

const WikiEntryPage = async ({ params, searchParams }: Args) => {
  const { slug = '', entrySlug = '' } = await params
  const { spoilers } = await searchParams
  const spoilersShown = spoilers === '1'

  const book = await queryBookBySlug({ slug })
  if (!book) return notFound()

  const [data, readerProgress] = await Promise.all([
    queryWikiEntry({ bookId: book.id, entrySlug }),
    queryWikiReaderProgress({ bookId: book.id }),
  ])
  if (!data) return notFound()

  const { entry, mentions, outgoingRelations, incomingRelations } = data
  const wikiPath = `/novel/${slug}/wiki`
  const entryPath = `${wikiPath}/${entrySlug}`
  const spoilerSuffix = spoilersShown ? '?spoilers=1' : ''
  const typeInfo = ENTRY_TYPE_LABELS[entry.type]
  const TypeIcon = typeInfo.icon

  const ambientBackground = typeof book.coverImage === 'object' && (
    <Image
      src={book.coverImage?.url || ''}
      alt={book.coverImage?.alt || ''}
      width={book.coverImage?.width || 300}
      height={book.coverImage?.height || 450}
      className="fixed top-0 left-0 w-screen h-screen object-cover -z-10 opacity-15 blur-xl pointer-events-none"
      priority
    />
  )

  // The whole entry is a spoiler for this reader — ask before showing it
  if (isSpoiler(entry.spoilerChapterIndex, readerProgress) && !spoilersShown) {
    return (
      <div className="container mx-auto py-4 md:py-8">
        {ambientBackground}
        <div className="max-w-lg mx-auto mt-12 md:mt-24">
          <Card>
            <CardContent className="flex flex-col items-center text-center gap-4 py-10">
              <EyeOff className="size-10 text-muted-foreground" />
              <h1 className="text-2xl font-bold">Обережно, спойлери</h1>
              <p className="text-muted-foreground">
                Цей запис безпечно читати з розділу{' '}
                <b className="text-foreground">{entry.spoilerChapterIndex}</b>
                {readerProgress > 0 ? (
                  <>
                    , а ваш прогрес — розділ <b className="text-foreground">{readerProgress}</b>.
                  </>
                ) : (
                  <>, а збереженого прогресу читання у вас немає.</>
                )}
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <Button asChild variant="outline">
                  <Link href={`${wikiPath}`}>
                    <ArrowLeft />
                    Назад до вікі
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`${entryPath}?spoilers=1`}>
                    <Eye />
                    Все одно показати
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { groups: relationGroups, hidden: hiddenRelations } = groupRelations({
    outgoing: outgoingRelations,
    incoming: incomingRelations,
    readerProgress,
    spoilersShown,
  })

  const visibleMentions = spoilersShown
    ? mentions
    : mentions.filter((mention) => !isSpoiler(mention.chapterIndex, readerProgress))
  const hiddenMentions = mentions.length - visibleMentions.length

  return (
    <div className="container mx-auto py-4 md:py-8 space-y-6">
      {ambientBackground}

      {/* Breadcrumb */}
      <Link
        href={`${wikiPath}${spoilerSuffix}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Вікі — {book.title}
      </Link>

      {/* Header */}
      <div className="flex gap-4 md:gap-6 items-start">
        {typeof entry.image === 'object' && entry.image?.url ? (
          <Image
            src={entry.image.url}
            alt={entry.image.alt || entry.title}
            width={entry.image.width || 112}
            height={entry.image.height || 112}
            className="size-24 md:size-28 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="size-24 md:size-28 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <TypeIcon className="size-10 text-muted-foreground" />
          </div>
        )}
        <div className="space-y-2 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold">{entry.title}</h1>
          <div className="flex gap-2 flex-wrap items-center">
            <Badge variant="default">
              <TypeIcon />
              {typeInfo.singular}
            </Badge>
            {entry.status === 'auto' && (
              <Badge variant="outline">
                <Bot />
                Згенеровано ШІ
              </Badge>
            )}
            {entry.firstAppearanceIndex && (
              <Badge variant="secondary" asChild>
                <Link href={`/novel/${slug}/${entry.firstAppearanceIndex}`}>
                  Перша поява: розділ {entry.firstAppearanceIndex}
                </Link>
              </Badge>
            )}
          </div>
          {entry.aliases && entry.aliases.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Також відомий як: {entry.aliases.join(', ')}
            </p>
          )}
        </div>
      </div>

      <SpoilerToggle
        basePath={entryPath}
        spoilersShown={spoilersShown}
        readerProgress={readerProgress}
        hiddenCount={hiddenRelations + hiddenMentions}
      />

      {/* Article */}
      {entry.shortDescription && (
        <p className="text-lg text-muted-foreground max-w-3xl">{entry.shortDescription}</p>
      )}
      {entry.content && (
        <div className="max-w-3xl">
          <RichText data={entry.content} />
        </div>
      )}
      {!entry.content && !entry.shortDescription && (
        <p className="text-muted-foreground">
          Стаття ще не згенерована — поки що є лише згадки з розділів нижче.
        </p>
      )}

      {/* Relations */}
      {relationGroups.size > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Зв’язки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...relationGroups.entries()].map(([label, items]) => (
              <Card key={label}>
                <CardContent className="pt-4 space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
                  <div className="flex gap-2 flex-wrap">
                    {items.map(({ relationId, other, ended }) => {
                      const OtherIcon = ENTRY_TYPE_LABELS[other.type].icon
                      return (
                        <Badge key={relationId} variant="secondary" asChild>
                          <Link
                            href={`${wikiPath}/${other.slug}${spoilerSuffix}`}
                            className={ended ? 'line-through opacity-70' : undefined}
                          >
                            <OtherIcon />
                            {other.title}
                          </Link>
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Mentions timeline */}
      {visibleMentions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Згадки за розділами</h2>
          <div className="space-y-3 max-w-3xl">
            {visibleMentions.map((mention) => (
              <div
                key={mention.id}
                className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/novel/${slug}/${mention.chapterIndex}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    Розділ {mention.chapterIndex}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {MENTION_TYPE_LABELS[mention.mentionType]}
                  </Badge>
                </div>
                {mention.quote && (
                  <blockquote className="border-l-2 border-border pl-3 text-sm italic text-muted-foreground flex gap-2">
                    <Quote className="size-3.5 shrink-0 mt-0.5" />
                    <span>{mention.quote}</span>
                  </blockquote>
                )}
                {mention.context && <p className="text-sm">{mention.context}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = '', entrySlug = '' } = await params
  const book = await queryBookBySlug({ slug })
  if (!book) return {}
  const data = await queryWikiEntry({ bookId: book.id, entrySlug })
  if (!data) return {}

  return {
    title: `${data.entry.title} — Вікі ${book.title} | Читати ранобе українською онлайн`,
    description:
      data.entry.shortDescription || `«${data.entry.title}» у вікі до книги «${book.title}».`,
    // AI-generated beta content — keep out of search indexes for now
    robots: { index: false, follow: true },
  }
}

export default WikiEntryPage
