import { ImageResponse } from 'next/og'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { OG_SIZE, OgLogo, loadOgFonts, og } from '@/lib/og'
import { toAbsoluteURL } from '@/lib/getURL'

// Загальне OG-зображення сайту: логотип, слоган і дві свіжі обкладинки
const getOgData = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const books = await payload.find({
      collection: 'books',
      limit: 2,
      sort: '-createdAt',
      depth: 1,
      where: { origin: { not_equals: 'original' }, coverImage: { exists: true } },
      select: { coverImage: true },
    })
    const covers = books.docs
      .map((book) => (typeof book.coverImage === 'object' ? book.coverImage?.url : null))
      .filter((url): url is string => Boolean(url))
      .map((url) => toAbsoluteURL(url, 'https://wuji.world'))
    return { covers, totalBooks: books.totalDocs }
  },
  ['site-og'],
  { revalidate: 3600 },
)

const tile = { display: 'flex', backgroundColor: og.tile, borderRadius: 28 } as const

export async function GET() {
  const { covers, totalBooks } = await getOgData()

  return new ImageResponse(
    (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 600 }}>
          <div style={{ ...tile, flex: 1, flexDirection: 'column', padding: '44px 48px', gap: 22 }}>
            <OgLogo size={112} />
            <div
              style={{
                display: 'flex',
                flexShrink: 0,
                fontFamily: 'Unbounded',
                fontWeight: 800,
                fontSize: 38,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
              }}
            >
              Ранобе українською
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                fontWeight: 500,
                lineHeight: 1.4,
                color: og.soft,
              }}
            >
              Японські, корейські й китайські новели — безкоштовно, з будь-якого пристрою.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, height: 124 }}>
            <div
              style={{
                ...tile,
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 32px',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', fontSize: 20, fontWeight: 500, color: og.muted }}>
                У каталозі
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Unbounded',
                  fontWeight: 800,
                  fontSize: 34,
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {`${totalBooks}+ ранобе`}
              </div>
            </div>
            <div
              style={{
                ...tile,
                width: 200,
                backgroundColor: og.accent,
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 700,
                color: og.ink,
              }}
            >
              wuji.world
            </div>
          </div>
        </div>

        {/* Свіжі обкладинки 2:3, зі зсувом по висоті */}
        <div style={{ display: 'flex', flex: 1, gap: 16 }}>
          {covers.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              width={244}
              height={366}
              style={{
                width: 244,
                height: 366,
                marginTop: i === 0 ? 40 : 144,
                objectFit: 'cover',
                borderRadius: 24,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadOgFonts() },
  )
}
