'use client'

import useSWR from 'swr'
import { PaginatedDocs } from 'payload'
import { User, ChapterComment, BookChapter, Book } from '@/payload-types'

export type LatestComment = ChapterComment & {
  user: User
  chapter: BookChapter & { book: Book }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Один ключ SWR для цитати у hero та стрічки коментарів — один запит на сторінку
export const useLatestComments = () => {
  const { data, isLoading } = useSWR<PaginatedDocs<ChapterComment>>(
    '/api/chapterComments?limit=6&sort=-createdAt&depth=2',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  )

  const comments = ((data?.docs || []) as LatestComment[]).filter(
    (comment) =>
      typeof comment.user === 'object' &&
      typeof comment.chapter === 'object' &&
      comment.chapter &&
      typeof comment.chapter.book === 'object' &&
      comment.chapter.book,
  )

  return { comments, isLoading }
}
