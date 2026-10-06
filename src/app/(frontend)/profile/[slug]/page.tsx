import type React from 'react'
import { notFound } from 'next/navigation'
import { queryUserBySlug } from '@/queries'
import { Lock, Sparkles } from 'lucide-react'
import { BookCard } from '@/components/BookCard'
import { ProgressCard } from '@/components/library-cards'
import { CoverGrid, SectionHeader, StatTile, Tile } from '@/components/bento'
import Image from 'next/image'
import { getUserAvatarURL, getUserBannerURL } from '@/lib/avatars'
import { cn } from '@/lib/utils'
import { getUserBadges } from '@/lib/supporters'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const pluralBooks = (count: number) =>
  count % 10 === 1 && count % 100 !== 11
    ? 'книга'
    : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)
      ? 'книги'
      : 'книг'

const UserProfilePage: React.FC<Args> = async ({ params }) => {
  const { slug = '' } = await params
  const user = await queryUserBySlug({ slug })

  if (!user) return notFound()

  const isPublic = user.isPublic
  const readProgresses = user.readProgresses || []
  const writtenBooks = user.writtenBooksDocs || []
  const userBannerURL = getUserBannerURL(user)

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      {/* Шапка: банер + аватар + нік */}
      <Tile className="overflow-hidden">
        <div className="relative h-36 bg-chip md:h-56">
          {userBannerURL && (
            <Image
              src={userBannerURL}
              alt={`${user.nickname} банер`}
              fill
              priority
              className="object-cover object-center"
            />
          )}
        </div>
        <div className="flex flex-wrap items-end gap-5 px-6 pb-6 md:px-8 md:pb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getUserAvatarURL(user)}
            alt={user.nickname}
            className="relative z-10 -mt-12 size-24 shrink-0 rounded-[26px] bg-chip object-cover ring-[6px] ring-tile md:-mt-16 md:size-32"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <h1 className="heading-display text-[30px] wrap-anywhere md:text-[44px]">{user.nickname}</h1>
            <div className="flex flex-wrap gap-2">
              {getUserBadges(user).map((badge) => (
                <span
                  key={badge.type}
                  className={cn(
                    'rounded-[10px] px-3 py-1.5 text-[13px] font-semibold',
                    badge.type === 'reader' ? 'bg-chip text-soft' : 'bg-primary/15 text-primary',
                  )}
                >
                  {badge.label}
                </span>
              ))}
              <span className="rounded-[10px] bg-chip px-3 py-1.5 text-[13px] font-semibold text-soft">
                з {new Date(user.createdAt).toLocaleDateString('uk-UA')}
              </span>
            </div>
          </div>
        </div>
      </Tile>

      {!isPublic ? (
        <Tile className="mx-auto mt-4 flex max-w-md flex-col items-center gap-4 p-10 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-chip">
            <Lock className="size-7 text-muted-foreground" />
          </span>
          <h2 className="heading-display text-2xl">Приватний профіль</h2>
          <p className="leading-relaxed text-muted-foreground">
            Користувач {user.nickname} приховав інформацію свого профілю. Ви можете бачити тільки
            нікнейм та дату приєднання.
          </p>
        </Tile>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
            <StatTile label="Книг у прогресі" value={readProgresses.length} />
            <StatTile label="Рік реєстрації" value={new Date(user.createdAt).getFullYear()} />
            {writtenBooks.length > 0 && <StatTile label="Написано творів" value={writtenBooks.length} accent />}
          </div>

          {writtenBooks.length > 0 && (
            <section className="mt-8 flex flex-col gap-[22px]">
              <SectionHeader title="Написані твори" />
              <CoverGrid>
                {writtenBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    overlay={
                      book.isAIAssisted && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-background/80 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
                          <Sparkles className="size-3" />
                          ШІ
                        </span>
                      )
                    }
                  />
                ))}
              </CoverGrid>
            </section>
          )}

          <section className="mt-8 flex flex-col gap-[22px]">
            <div className="flex items-baseline gap-3">
              <h2 className="heading-display text-[26px] md:text-[32px]">Прогрес читання</h2>
              {readProgresses.length > 0 && (
                <span className="text-[15px] text-muted-foreground">
                  {readProgresses.length} {pluralBooks(readProgresses.length)}
                </span>
              )}
            </div>

            {readProgresses.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                {readProgresses.map((progress) => (
                  <ProgressCard
                    key={progress.id}
                    progressID={progress.id}
                    book={progress.book}
                    page={progress.chapter || 0}
                    updatedAt={progress.updatedAt}
                    showContinue={false}
                  />
                ))}
              </div>
            ) : (
              <Tile className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="heading-display text-xl">Немає активного читання</span>
                <span className="max-w-md text-[15px] text-muted-foreground">
                  Користувач {user.nickname} поки що не читає жодної книги.
                </span>
              </Tile>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default UserProfilePage
