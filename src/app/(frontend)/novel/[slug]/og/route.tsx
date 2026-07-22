import { queryBookBySlug } from '@/queries'
import { BOOK_OG_CACHE_TAG } from '@/lib/bookOg'
import { unstable_cache } from 'next/cache'
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

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
export const size = {
  width: 1200,
  height: 630,
}
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

  const authorName =
    book.origin === 'original'
      ? typeof book.owner === 'object'
        ? book.owner?.nickname || ''
        : ''
      : typeof book.author === 'string'
        ? book.author
        : book.author?.name || ''

  const SegoeUIBold = await readFile(join(process.cwd(), 'src/fonts/SegoeUI-Bold.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundImage: `url('https://wuji.world/og-background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Book Cover - Left side */}
        <div
          style={{
            position: 'absolute',
            left: '80px',
            top: '125px',
            width: '280px',
            height: '420px',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {/*eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={'https://wuji.world' + coverImageUrl}
            alt={book.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
        {/* Site name */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            opacity: 1,
            textAlign: 'center',
            flex: 1,
            position: 'absolute',
            top: '16px',
            right: '32px',
            color: 'white',
          }}
        >
          ВуЧи
        </div>
        {/* Content - Right side */}
        <div
          style={{
            position: 'absolute',
            left: '420px',
            top: '125px',
            right: '60px',
            height: '420px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: '16px',
            color: 'white',
          }}
        >
          {/* Book Title */}
          <div
            style={{
              fontSize: '96px',
              fontWeight: 800,
              lineHeight: 1.1,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            {book.title}
          </div>

          {/* Author */}
          {authorName && (
            <div
              style={{
                fontSize: '24px',
                opacity: 0.8,
                textAlign: 'left',
              }}
            >
              {authorName}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Segoe UI',
          data: SegoeUIBold,
          style: 'normal',
          weight: 800,
        },
      ],
    },
  )
}
