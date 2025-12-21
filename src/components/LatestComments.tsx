'use client'

import React from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, ChapterComment, BookChapter, Book } from '@/payload-types'
import { PaginatedDocs } from 'payload'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { getUserAvatarURL } from '@/lib/avatars'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const LatestComments = () => {
  const { data, isLoading } = useSWR<PaginatedDocs<ChapterComment>>(
    '/api/chapterComments?limit=5&sort=-createdAt&depth=2',
    fetcher,
    {
      refreshInterval: 30000, // Оновлення кожні 30 секунд
      revalidateOnFocus: true,
    },
  )

  const comments = (data?.docs || []) as (ChapterComment & {
    user: User
    chapter: BookChapter & { book: Book }
  })[]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Останні коментарі</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-6 h-6 bg-muted rounded-full animate-pulse shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-3 bg-muted rounded animate-pulse w-20" />
                  <div className="h-3 bg-muted rounded animate-pulse w-16" />
                </div>
              </div>
              <div className="h-3 bg-muted rounded animate-pulse w-32 mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-full" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Останні коментарі</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.slice(0, 5).map((comment) => {
          if (
            typeof comment === 'string' ||
            typeof comment.user === 'string' ||
            typeof comment.chapter === 'string'
          )
            return null

          const user = comment.user
          const chapter = comment.chapter as BookChapter & { book: Book }
          const book = typeof chapter.book === 'string' ? null : chapter.book

          if (!book) return null

          return (
            <div key={comment.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="flex items-start gap-2 mb-2">
                <Avatar>
                  <AvatarImage src={getUserAvatarURL(comment.user)} alt={comment?.user?.nickname} />
                  <AvatarFallback>
                    {getUserInitials(comment?.user?.nickname || 'NO NICKNAME')}
                  </AvatarFallback>
                </Avatar>
                <Link className="min-w-0 flex-1 group" href={`/profile/${user.slug}`}>
                  <p className="text-xs font-medium truncate group-hover:underline">
                    {user?.nickname}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString('uk-UA', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </Link>
              </div>
              <Link href={`/redirect/novel/${chapter.id}`} className="block mb-1 group">
                <p className="text-xs font-medium group-hover:text-primary transition-colors line-clamp-1">
                  {chapter.title}
                </p>
                <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors line-clamp-1">
                  {book.title}
                </p>
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-2">{comment.content}</p>
            </div>
          )
        })}

        {!isLoading && comments.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Поки що немає коментарів</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
