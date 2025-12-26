'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import CommentInput from './comment-input'
import { ChapterComment } from '@/payload-types'
import { stringify } from 'qs-esm'
import { PaginatedDocs } from 'payload'
import CommentPagination from './CommentPagination'
import useSWR from 'swr'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from './ui/badge'
import { MessageCircle, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getUserAvatarURL } from '@/lib/avatars'
import { getUserBadges } from '@/lib/supporters'
import { SanitizedMarkdown } from './SanitizedMarkdown'

// Constants
const MAX_NESTING_LEVEL = 5

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

  // Create query string for top-level comments with reply counts only
  const queryString = stringify({
    where: {
      chapter: { equals: chapterID },
      parent: { exists: false }, // Only top-level comments
    },
    select: {
      content: true,
      user: true,
      createdAt: true,
      parent: true,
      breadcrumbs: true,
      children: true, // Include children to get counts
    },
    populate: {
      user: {
        nickname: true,
        roles: true,
      },
    },
    joins: {
      children: {
        limit: 1, // Get only one child (required for getting count)
        count: true, // Get count of replies
      },
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
    mutate() // This will refetch the data
  }

  if (error) {
    console.error('Error fetching comments:', error)
  }

  // Calculate how many skeletons to show when loading initially
  const showSkeletons = isValidating && !comments
  const skeletonCount = 5 // Default number of skeleton items to show initially

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
          comments.docs.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              chapterID={chapterID}
              onReplySubmitted={refreshComments}
              level={0}
            />
          ))
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

type CommentThreadProps = {
  comment: ChapterComment
  chapterID: string
  onReplySubmitted: () => void
  level: number
}

function CommentThread({ comment, chapterID, onReplySubmitted, level }: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

  // Get level from breadcrumbs if available, otherwise use passed level
  const commentLevel = comment.breadcrumbs ? comment.breadcrumbs.length : level
  const canReply = commentLevel < MAX_NESTING_LEVEL

  // Create query string for replies
  const repliesQueryString = stringify({
    where: {
      parent: { equals: comment.id },
    },
    select: {
      content: true,
      user: true,
      createdAt: true,
      parent: true,
      breadcrumbs: true,
      children: true,
    },
    populate: {
      user: {
        nickname: true,
        roles: true,
      },
    },
    joins: {
      children: {
        limit: 1,
        count: true,
      },
    },
    limit: 50,
  })

  // Use SWR for replies, but only when showReplies is true
  const {
    data: repliesData,
    mutate: mutateReplies,
    isValidating: isLoadingReplies,
  } = useSWR<PaginatedDocs<ChapterComment>>(
    showReplies ? `/api/chapterComments?${repliesQueryString}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // Не ревалідувати при фокусі
      revalidateOnReconnect: false, // Не ревалідувати при реконекті
      refreshInterval: 0, // Вимкнути автоматичне оновлення
    },
  )

  const replies = repliesData?.docs || []

  const handleReplySubmitted = () => {
    setShowReplyForm(false)
    onReplySubmitted() // Оновлює головний список

    // Якщо відповіді показані, оновлюємо їх через SWR
    if (showReplies) {
      mutateReplies() // Це оновить дані без показу завантаження, якщо дані вже є
    } else {
      // Якщо відповіді приховані, показуємо їх (SWR автоматично завантажить)
      setShowReplies(true)
    }
  }

  const handleShowReplies = () => {
    setShowReplies(!showReplies)
    // SWR автоматично почне завантаження коли showReplies стане true
  }

  // Get reply count from children join
  const replyCount = comment.children?.totalDocs || 0
  const hasReplies = replyCount > 0
  const indent = `${Math.min(commentLevel * 2, 24)}`

  return (
    <div
      style={{
        paddingLeft: indent + 'px',
      }}
    >
      <CommentCard
        comment={comment}
        level={commentLevel}
        onReply={canReply ? () => setShowReplyForm(!showReplyForm) : undefined}
        showReplyButton={canReply}
      />

      {/* Reply Form */}
      {showReplyForm && canReply && (
        <div className="mt-4">
          <CommentInput
            chapterID={chapterID}
            parentID={comment.id}
            onCommentSubmitted={handleReplySubmitted}
            placeholder="Напишіть відповідь..."
            showCancel
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Replies Section */}
      {hasReplies && (
        <div className="mt-2">
          {/* Toggle Replies Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowReplies}
            className="mb-2 text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
            disabled={isLoadingReplies && !repliesData} // Тільки показуємо disabled коли немає кешованих даних
          >
            {isLoadingReplies && !repliesData ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1" />
            ) : showReplies ? (
              <ChevronDown className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1" />
            )}
            {isLoadingReplies && !repliesData ? (
              'Завантаження...'
            ) : (
              <>
                {showReplies ? 'Приховати' : 'Показати'} {replyCount}
                {replyCount === 1 ? ' відповідь' : replyCount < 5 ? ' відповіді' : ' відповідей'}
              </>
            )}
          </Button>

          {/* Replies List */}
          {showReplies && (
            <div className="space-y-4 border-l-2 border-muted pl-4">
              {isLoadingReplies && !repliesData ? (
                // Показуємо скелетони тільки при першому завантаженні
                Array(1)
                  .fill(0)
                  .map((_, i) => <CommentSkeleton key={i} />)
              ) : replies.length > 0 ? (
                replies.map((reply) => (
                  <CommentThread
                    key={reply.id}
                    comment={reply}
                    chapterID={chapterID}
                    onReplySubmitted={onReplySubmitted}
                    level={commentLevel + 1}
                  />
                ))
              ) : (
                <div className="text-muted-foreground text-sm py-2">Відповідей поки що немає</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type CommentCardProps = {
  comment: ChapterComment
  level?: number
  onReply?: () => void
  showReplyButton?: boolean
}

function CommentCard({ comment, level = 0, onReply, showReplyButton = true }: CommentCardProps) {
  if (typeof comment.user === 'string') {
    return null
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
    <Card className="w-full pb-2 pt-4">
      <CardContent className="flex gap-4 ">
        <Link href={`/profile/${comment.user.slug}`}>
          <Avatar className={level > 0 ? 'w-8 h-8' : 'w-10 h-10'}>
            <AvatarImage src={getUserAvatarURL(comment.user)} alt={comment?.user?.nickname} />
            <AvatarFallback className={level > 0 ? 'text-xs' : ''}>
              {getUserInitials(comment?.user?.nickname || 'NO NICKNAME')}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 flex flex-col items-start">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              className={`font-semibold ${level > 0 ? 'text-sm' : ''} hover:underline`}
              href={`/profile/${comment.user.slug}`}
            >
              {comment.user.nickname}
            </Link>
            {getUserBadges(comment.user).map((badge) => {
              if (badge.type === 'admin') {
                return (
                  <Badge key={badge.type} className="text-xs">
                    {badge.label}
                  </Badge>
                )
              }
              if (badge.type === 'editor') {
                return (
                  <Badge key={badge.type} className="text-xs">
                    {badge.label}
                  </Badge>
                )
              }
              if (badge.type === 'supporter') {
                return (
                  <Badge
                    key={badge.type}
                    variant="outline"
                    className="text-xs bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/50"
                  >
                    {badge.label}
                  </Badge>
                )
              }
              if (badge.type === 'reader') {
                return (
                  <Badge key={badge.type} variant="secondary" className="text-xs">
                    {badge.label}
                  </Badge>
                )
              }
              return null
            })}
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString('uk-UA')}
            </span>
          </div>
          <SanitizedMarkdown content={comment.content} className={'mt-2'} />

          {/* Reply Button */}
          {showReplyButton && onReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReply}
              className="mt-2 p-0 h-auto text-muted-foreground hover:text-foreground font-normal self-end"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Відповісти
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton component for loading state
function CommentSkeleton() {
  return (
    <Card className="w-full pb-2 pt-4">
      <CardContent className="flex gap-4">
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
