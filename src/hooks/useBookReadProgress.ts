'use client'

import useSWR from 'swr'
import { stringify } from 'qs-esm'
import { useAuth } from '@/providers/auth'

/**
 * Прогрес читання поточного користувача для книги.
 * undefined — ще завантажується, null — немає прогресу (або гість), число — номер розділу.
 */
export const useBookReadProgress = (bookSlug: string) => {
  const { user } = useAuth()

  const key = user
    ? `/api/readProgress?${stringify({
        where: { 'book.slug': { equals: bookSlug }, user: { equals: user.id } },
        select: { chapter: true },
        limit: 1,
      })}`
    : null

  const { data, isLoading } = useSWR<{ docs?: { chapter: number }[] }>(
    key,
    (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json()),
    { revalidateOnFocus: false },
  )

  if (user === undefined) return { chapter: undefined, user }
  if (user === null) return { chapter: null, user }
  if (isLoading || !data) return { chapter: undefined, user }
  return { chapter: data.docs?.[0]?.chapter ?? null, user }
}
