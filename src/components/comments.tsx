'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import CommentInput from './comment-input'
import { ChapterComment } from '@/payload-types'
import { stringify } from 'qs-esm'
import { PaginatedDocs } from 'payload'
import CommentPagination from './CommentPagination'
import useSWR from 'swr'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from './ui/badge'

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch comments')
  }

  return res.json()
}

type CommentsProps = {
  chapterID: string
}

const Comments: React.FC<CommentsProps> = ({ chapterID }) => {
  const [page, setPage] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const commentContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoaded) {
      setIsLoaded(true)
      return
    }
    //scroll to top of comments when page changes, but not on initial load
    if (commentContainer.current) {
      commentContainer.current.scrollIntoView({ behavior: 'smooth' })
    }

    //Ігноруємо isLoaded в залежностях, щоб не викликати повторний рендер
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Create query string for comments
  const queryString = stringify({
    where: {
      chapter: { equals: chapterID },
    },
    select: {
      content: true,
      user: true,
      createdAt: true,
    },
    limit: 10,
    page: page,
  })

  // Use SWR for data fetching
  const {
    data: comments,
    error,
    mutate,
    isValidating,
  } = useSWR<PaginatedDocs<ChapterComment>>(`/api/chapterComments?${queryString}`, fetcher, {
    keepPreviousData: true, // Keep showing previous data while loading new data
  })

  // Function to trigger revalidation
  const refreshComments = () => {
    mutate()
  }

  if (error) {
    console.error('Error fetching comments:', error)
  }

  // Calculate how many skeletons to show when loading initially
  const showSkeletons = isValidating && !comments
  const skeletonCount = 10 // Default number of skeleton items to show initially

  return (
    <div className="space-y-6 mt-12" ref={commentContainer}>
      <CommentInput chapterID={chapterID} onCommentSubmitted={refreshComments} />

      {/* Show either loaded comments or skeletons */}
      <div className="space-y-4 min-h-[300px]">
        {showSkeletons ? (
          // Show skeleton loaders when initially loading
          Array(skeletonCount)
            .fill(0)
            .map((_, i) => <CommentSkeleton key={i} />)
        ) : comments?.docs?.length ? (
          // Show actual comments when loaded
          comments.docs.map((comment) => <CommentCard key={comment.id} comment={comment} />)
        ) : (
          // Show message when no comments
          <div className="text-muted-foreground text-sm py-6">Коментарів поки що немає</div>
        )}
      </div>

      {/* Maintain consistent height with a loading indicator when changing pages */}
      {isValidating && comments && (
        <div className="fixed bottom-6 right-6 bg-background border rounded-full shadow-md px-4 py-2 text-sm font-medium animate-pulse">
          Завантажуємо коментарі...
        </div>
      )}

      {comments && comments.totalPages > 1 ? (
        <CommentPagination
          totalPages={comments.totalPages}
          currentPage={page}
          setPage={(newPage) => {
            setPage(newPage)
          }}
        />
      ) : null}
    </div>
  )
}

type CommentCardProps = {
  comment: ChapterComment
}

function CommentCard({ comment }: CommentCardProps) {
  if (typeof comment.user === 'string') {
    return null
  }
  return (
    <Card className="w-full">
      <CardContent className="flex gap-4 py-4">
        <Avatar>
          <AvatarFallback>{comment.user.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{comment.user.nickname}</span>
            {comment.user.roles.includes('admin') && (
              <Badge className="text-xs">Адміністратор</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString('uk-UA')}
            </span>
          </div>
          <p className="mt-2 text-sm">{comment.content}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton component for loading state
function CommentSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="flex gap-4 py-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}

export default Comments
