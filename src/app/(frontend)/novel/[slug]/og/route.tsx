import { queryBookBySlug } from '@/queries'
import { BOOK_OG_CACHE_TAG } from '@/lib/bookOg'
import { unstable_cache } from 'next/cache'
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { OG_SIZE, OgLogo, loadOgFonts, og, titleSize } from '@/lib/og'
import { toAbsoluteURL } from '@/lib/getURL'

/**
 * Кешована версія queryBookBySlug для OG зображення.
 * Ревалідується тегом BOOK_OG_CACHE_TAG у hooks книги, fallback — раз на годину.
 */
const queryBookBySlugCached = unstable_cache(
  async (slug: string) => queryBookBySlug({ slug }),
  ['book-og'],
  {
    tags: [BOOK_OG_CACHE_TAG],
    revalidate: 3600,
  },
)
// Image metadata
export const size = OG_SIZE
export const contentType = 'image/png'

// Image generation
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  //get slug from params

  const { slug = '' } = await params
  const book = await queryBookBySlugCached(slug)

  if (!book) {
    return new Response('Not Found', { status: 404 })
  }

  // Extract cover image URL
  const coverImageUrl =
    typeof book.coverImage === 'string' ? book.coverImage : book.coverImage?.url || ''
  const coverSrc = coverImageUrl ? toAbsoluteURL(coverImageUrl, 'https://wuji.world') : null

  const authorName =
    book.origin === 'original'
      ? typeof book.owner === 'object'
        ? book.owner?.nickname || ''
        : ''
      : typeof book.author === 'string'
        ? book.author
        : book.author?.name || ''

  const genres = (book.genres || [])
    .map((genre) => (typeof genre === 'object' && genre ? genre.title : null))
    .filter((title): title is string => Boolean(title))
    .slice(0, 3)
  const chapters = book.chapterCount || 0
  const statusLabel =
    { ongoing: 'Онгоінг', completed: 'Завершено', hiatus: 'Пауза', cancelled: 'Скасовано' }[
      book.status as string
    ] || null
  const kind = book.origin === 'original' ? 'Авторський твір' : 'Ранобе українською'

  // lineClamp у satori ламає висоту блоку, тож надто довгі назви обрізаємо самі
  const title = book.title.length > 80 ? `${book.title.slice(0, 78).trimEnd()}…` : book.title

  const tile = { display: 'flex', backgroundColor: og.tile, borderRadius: 28 } as const

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        gap: 16,
        padding: 40,
        backgroundColor: og.bg,
        fontFamily: 'Onest',
        color: og.fg,
      }}
    >
      {/* Обкладинка */}
      <div style={{ ...tile, width: 367, height: 550, overflow: 'hidden', flexShrink: 0 }}>
        {coverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            width={367}
            height={550}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 28 }}
          />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16 }}>
        {/* Назва */}
        <div style={{ ...tile, flex: 1, flexDirection: 'column', padding: '36px 40px', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              flexShrink: 0,
              marginBottom: 4,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: og.accent,
            }}
          >
            {kind}
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Unbounded',
              fontWeight: 800,
              fontSize: titleSize(title, [60, 50, 40, 34]),
              flexShrink: 0,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </div>
          {authorName && (
            <div
              style={{
                display: 'flex',
                flexShrink: 0,
                fontSize: 24,
                fontWeight: 500,
                color: og.muted,
              }}
            >
              {authorName}
            </div>
          )}
          {genres.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', flexShrink: 0 }}>
              {genres.map((genre) => (
                <div
                  key={genre}
                  style={{
                    display: 'flex',
                    padding: '10px 18px',
                    borderRadius: 14,
                    backgroundColor: og.chip,
                    fontSize: 20,
                    fontWeight: 700,
                    color: og.soft,
                  }}
                >
                  {genre}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Нижній ряд: розділи + логотип */}
        <div style={{ display: 'flex', gap: 16, height: 124 }}>
          <div
            style={{
              ...tile,
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 36px',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', fontSize: 20, fontWeight: 500, color: og.muted }}>
              {statusLabel ? `Розділів · ${statusLabel}` : 'Розділів'}
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'Unbounded',
                fontWeight: 800,
                fontSize: 46,
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {chapters}
            </div>
          </div>
          <div
            style={{
              ...tile,
              width: 300,
              backgroundColor: og.accent,
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 36px',
              gap: 10,
            }}
          >
            <OgLogo size={46} color={og.ink} accent={og.ink} />
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                fontWeight: 700,
                color: og.ink,
                opacity: 0.75,
              }}
            >
              wuji.world
            </div>
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: await loadOgFonts(),
    },
  )
}
