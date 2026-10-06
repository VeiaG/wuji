'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Banner,
  Button,
  ChevronIcon,
  Gutter,
  Pill,
  SelectInput,
  ShimmerEffect,
  toast,
  useConfig,
  useStepNav,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import { stringify } from 'qs-esm'
import type { Book, BookChapter, Complaint, User } from '@/payload-types'
import { ChapterWorkspace } from './ChapterWorkspace.client'
import { scrollToHighlight } from './lexicalRanges'
import './ComplaintsReview.scss'

const baseClass = 'complaints-review'

const query = stringify(
  {
    where: { status: { in: ['pending', 'reviewing'] } },
    sort: 'createdAt',
    limit: 1000,
    depth: 1,
    populate: {
      books: { title: true, slug: true },
      bookChapters: { title: true },
      users: { nickname: true, email: true },
    },
  },
  { addQueryPrefix: true },
)

const relId = (value: string | { id: string } | null | undefined) =>
  typeof value === 'string' ? value : (value?.id ?? '')

const bookOf = (c: Complaint) => (typeof c.book === 'object' ? (c.book as Book) : null)
const chapterOf = (c: Complaint) =>
  typeof c.chapter === 'object' ? (c.chapter as BookChapter) : null
const userOf = (c: Complaint) => (typeof c.user === 'object' && c.user ? (c.user as User) : null)

// Черга: книга → номер розділу → позиція в тексті, щоб скарги одного розділу йшли поспіль
const byReadingOrder = (a: Complaint, b: Complaint) =>
  (bookOf(a)?.title ?? '').localeCompare(bookOf(b)?.title ?? '', 'uk') ||
  a.pageNumber - b.pageNumber ||
  (a.position?.start ?? 0) - (b.position?.start ?? 0)

export function ComplaintsReviewClient() {
  const { config } = useConfig()
  const apiURL = `${config.serverURL}${config.routes.api}`
  const adminRoute = config.routes.admin
  const { setStepNav } = useStepNav()

  const [complaints, setComplaints] = useState<Complaint[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bookFilter, setBookFilter] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [modified, setModified] = useState(false)

  useEffect(() => setStepNav([{ label: 'Скарги на переклад' }]), [setStepNav])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${apiURL}/complaints${query}`, { credentials: 'include' })
        if (!res.ok) throw new Error(`Не вдалося завантажити скарги (${res.status})`)
        const { docs } = (await res.json()) as { docs: Complaint[] }
        setComplaints(docs.sort(byReadingOrder))
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [apiURL])

  const queue = useMemo(
    () => (complaints ?? []).filter((c) => !bookFilter || relId(c.book) === bookFilter),
    [complaints, bookFilter],
  )
  const activeIndex = Math.max(
    0,
    queue.findIndex((c) => c.id === activeId),
  )
  const active = queue[activeIndex] ?? null
  const chapterId = active ? relId(active.chapter) : null

  const bookOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>()
    for (const c of complaints ?? []) {
      const id = relId(c.book)
      const entry = counts.get(id) ?? { label: bookOf(c)?.title ?? id, count: 0 }
      entry.count++
      counts.set(id, entry)
    }
    return [...counts].map(([value, { label, count }]) => ({ value, label: `${label} (${count})` }))
  }, [complaints])

  const chapterComplaints = useMemo(
    () => queue.filter((c) => relId(c.chapter) === chapterId),
    [queue, chapterId],
  )

  // Незбережені правки живуть у редакторі розділу — не даємо піти в інший розділ
  const goTo = useCallback(
    (target: Complaint | undefined) => {
      if (!target) return
      if (modified && relId(target.chapter) !== chapterId) {
        toast.warning('Спершу збережіть або скасуйте зміни в розділі')
        return
      }
      setActiveId(target.id)
    },
    [modified, chapterId],
  )

  const onStatus = useCallback(
    async (ids: string[], status: 'resolved' | 'rejected') => {
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`${apiURL}/complaints/${id}?depth=0&select[id]=true`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
          if (!res.ok) throw new Error(`Не вдалося оновити скаргу (${res.status})`)
        }),
      )
      // Наступна — та, що стояла після поточної
      const rest = queue.filter((c) => !ids.includes(c.id))
      const next = queue.slice(activeIndex + 1).find((c) => !ids.includes(c.id)) ?? rest.at(-1)
      setComplaints((prev) => prev?.filter((c) => !ids.includes(c.id)) ?? null)
      setActiveId(next?.id ?? null)
      toast.success(
        status === 'resolved'
          ? ids.length > 1
            ? `Виправлено скарг: ${ids.length}`
            : 'Скаргу позначено виправленою'
          : 'Скаргу відхилено',
      )
    },
    [apiURL, queue, activeIndex],
  )

  const book = active ? bookOf(active) : null
  const chapter = active ? chapterOf(active) : null
  // Розділ видалено (напр. перезаписано реімпортом) — populate лишає голий id
  const chapterMissing = !!active && !chapter
  const [rejecting, setRejecting] = useState(false)
  const author = active ? userOf(active) : null

  return (
    <Gutter className={baseClass}>
      <header className={`${baseClass}__header`}>
        <h1 className={`${baseClass}__title`}>Скарги на переклад</h1>
        <div className={`${baseClass}__filter`}>
          <SelectInput
            name="complaints-book"
            path="complaints-book"
            placeholder="Усі книги"
            options={bookOptions}
            value={bookFilter ?? undefined}
            isClearable
            onChange={(option) => {
              const value = option && !Array.isArray(option) ? String(option.value) : null
              if (modified) {
                toast.warning('Спершу збережіть або скасуйте зміни в розділі')
                return
              }
              setBookFilter(value)
              setActiveId(null)
            }}
          />
        </div>
      </header>

      {error && <Banner type="error">{error}</Banner>}
      {!complaints && !error && <ShimmerEffect height={480} />}
      {complaints && !active && (
        <Banner type="success">Відкритих скарг немає — все розібрано.</Banner>
      )}

      {active && chapterId && (
        <>
          <div className={`${baseClass}__nav`}>
            <Button
              buttonStyle="icon-label"
              margin={false}
              aria-label="Попередня скарга"
              disabled={activeIndex === 0}
              onClick={() => goTo(queue[activeIndex - 1])}
            >
              <ChevronIcon direction="left" />
            </Button>
            <span className={`${baseClass}__counter`}>
              Скарга {activeIndex + 1} з {queue.length}
            </span>
            <Button
              buttonStyle="icon-label"
              margin={false}
              aria-label="Наступна скарга"
              disabled={activeIndex >= queue.length - 1}
              onClick={() => goTo(queue[activeIndex + 1])}
            >
              <ChevronIcon direction="right" />
            </Button>
          </div>

          <article className={`${baseClass}__complaint`}>
            <div className={`${baseClass}__meta`}>
              <span className={`${baseClass}__where`}>
                {book?.title} · Розділ {active.pageNumber}
                {chapter?.title ? `: ${chapter.title}` : ''}
              </span>
              <Pill size="small" pillStyle={active.status === 'reviewing' ? 'warning' : 'light'}>
                {active.status === 'reviewing' ? 'На розгляді' : 'Очікує'}
              </Pill>
            </div>
            <button
              type="button"
              className={`${baseClass}__quote`}
              title="Показати в тексті"
              onClick={() => {
                if (!scrollToHighlight('complaint-active'))
                  toast.info('Фрагмент не знайдено в тексті')
              }}
            >
              {active.selectedText}
            </button>
            {active.description && (
              <p className={`${baseClass}__description`}>{active.description}</p>
            )}
            <div className={`${baseClass}__byline`}>
              <span>
                {author ? author.nickname || author.email : 'Гість'} ·{' '}
                {new Date(active.createdAt).toLocaleString('uk-UA', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {/* Як у сповіщеннях коментарів: за id розділу і без запису прогресу читання.
                  Якщо розділу з таким id вже немає — за номером, скарга може бути ще актуальною */}
              {(!chapterMissing || book?.slug) && (
                <a
                  href={
                    chapterMissing
                      ? `/novel/${book?.slug}/${active.pageNumber}?disableSaving=true`
                      : `/redirect/novel/${chapterId}?disableSaving=true`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Розділ на сайті ↗
                </a>
              )}
              <Link
                href={formatAdminURL({ adminRoute, path: `/collections/complaints/${active.id}` })}
              >
                Скарга в адмінці
              </Link>
            </div>
          </article>

          {chapterMissing ? (
            <>
              <Banner type="info">
                Розділу, до якого прив&apos;язана скарга, більше не існує — можливо, його
                перезаписано імпортом. Перевірте розділ {active.pageNumber} на сайті й виправте
                вручну.
              </Banner>
              <div className={`${baseClass}__actions`}>
                <div className={`${baseClass}__actions-side`}>
                  <Button
                    buttonStyle="secondary"
                    margin={false}
                    disabled={rejecting}
                    onClick={async () => {
                      setRejecting(true)
                      try {
                        await onStatus([active.id], 'rejected')
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : String(err))
                      } finally {
                        setRejecting(false)
                      }
                    }}
                  >
                    Відхилити
                  </Button>
                  <Button
                    buttonStyle="subtle"
                    margin={false}
                    onClick={() => goTo(queue[activeIndex + 1] ?? queue[0])}
                  >
                    Пропустити
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <ChapterWorkspace
              key={chapterId}
              chapterId={chapterId}
              active={active}
              chapterComplaints={chapterComplaints}
              apiURL={apiURL}
              onSelect={(id) => setActiveId(id)}
              onModifiedChange={setModified}
              onStatus={onStatus}
              onSkip={() => goTo(queue[activeIndex + 1] ?? queue[0])}
              onChapterSaved={(title) =>
                setComplaints(
                  (prev) =>
                    prev?.map((c) =>
                      relId(c.chapter) === chapterId && chapterOf(c)
                        ? { ...c, chapter: { ...chapterOf(c)!, title } }
                        : c,
                    ) ?? null,
                )
              }
            />
          )}
        </>
      )}
    </Gutter>
  )
}
