'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import ReviewInput from './review-input'
import { Review } from '@/payload-types'
import { stringify } from 'qs-esm'
import { PaginatedDocs } from 'payload'
import CommentPagination from './CommentPagination'
import useSWR from 'swr'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from './ui/badge'
import { Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/providers/auth'
import Stars from './stars'

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch reviews')
  }

  return res.json()
}

type ReviewsProps = {
  bookID: string
}

const Reviews: React.FC<ReviewsProps> = ({ bookID }) => {
  const [page, setPage] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const reviewContainer = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) {
      setIsLoaded(true)
      return
    }
    if (reviewContainer.current) {
      reviewContainer.current.scrollIntoView({ behavior: 'smooth' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Check if user has already reviewed
  const userReviewQueryString =
    user && user.id
      ? stringify({
          where: {
            book: { equals: bookID },
            user: { equals: user.id },
          },
          limit: 1,
        })
      : null

  const { data: userReviewData, isLoading: isLoadingUserReview } = useSWR<PaginatedDocs<Review>>(
    userReviewQueryString ? `/api/reviews?${userReviewQueryString}` : null,
    fetcher,
  )

  const userReview = userReviewData?.docs?.[0] || null

  // Determine if we're still loading auth state
  const isLoadingAuth = !isClient || user === undefined
  const isLoadingReviewState = user && isLoadingUserReview

  // Query for all reviews
  const queryString = stringify({
    where: {
      book: { equals: bookID },
    },
    select: {
      content: true,
      rating: true,
      user: true,
      createdAt: true,
    },
    populate: {
      user: {
        nickname: true,
        roles: true,
        slug: true,
      },
    },
    limit: 10,
    page: page,
    sort: '-createdAt',
  })

  const {
    data: reviews,
    error,
    mutate,
    isValidating,
  } = useSWR<PaginatedDocs<Review>>(`/api/reviews?${queryString}`, fetcher, {
    keepPreviousData: true,
  })

  const refreshReviews = () => {
    mutate()
  }

  if (error) {
    console.error('Error fetching reviews:', error)
  }

  const showSkeletons = isValidating && !reviews
  const skeletonCount = 5

  const handleEditClick = (review: Review) => {
    setEditingReview(review)
    // Scroll to top to show the edit form
    if (reviewContainer.current) {
      reviewContainer.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
  }

  const handleReviewSubmitted = () => {
    setEditingReview(null)
    refreshReviews()
  }

  return (
    <div className="space-y-6" ref={reviewContainer}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Відгуки</CardTitle>
        </CardHeader>
      </Card>

      {/* Show loading skeleton while auth or user review is loading */}
      {(isLoadingAuth || isLoadingReviewState) && <ReviewInputSkeleton />}

      {/* Show review form only if user hasn't reviewed yet or is editing */}
      {!isLoadingAuth && !isLoadingReviewState && user && (!userReview || editingReview) && (
        <ReviewInput
          bookID={bookID}
          onReviewSubmitted={handleReviewSubmitted}
          existingReview={editingReview}
          onCancel={editingReview ? handleCancelEdit : undefined}
        />
      )}

      {/* Show message if user hasn't logged in */}
      {!isLoadingAuth && !user && (
        <Card>
          <CardContent className="py-4">
            <p className="text-muted-foreground text-sm">
              <Link href="/login" className="text-blue-500 hover:underline">
                Увійдіть
              </Link>
              {' '}щоб залишити відгук
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 min-h-[300px]">
        {showSkeletons ? (
          Array(skeletonCount)
            .fill(0)
            .map((_, i) => <ReviewSkeleton key={i} />)
        ) : reviews?.docs?.length ? (
          reviews.docs.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={
                user && typeof review.user !== 'string' && review.user.id === user.id
                  ? () => handleEditClick(review)
                  : undefined
              }
              onDelete={
                user && typeof review.user !== 'string' && review.user.id === user.id
                  ? () => handleDelete(review.id, mutate)
                  : undefined
              }
            />
          ))
        ) : (
          <div className="text-muted-foreground text-sm py-6">Відгуків поки що немає</div>
        )}
      </div>

      {isValidating && reviews && (
        <div className="fixed bottom-6 right-6 bg-background border rounded-full shadow-md px-4 py-2 text-sm font-medium animate-pulse">
          Завантажуємо відгуки...
        </div>
      )}

      {reviews && reviews.totalPages > 1 ? (
        <CommentPagination
          totalPages={reviews.totalPages}
          currentPage={page}
          setPage={(newPage) => {
            setPage(newPage)
          }}
        />
      ) : null}
    </div>
  )
}

type ReviewCardProps = {
  review: Review
  onEdit?: () => void
  onDelete?: () => void
}

function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  if (typeof review.user === 'string') {
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
    <Card className="w-full">
      <CardContent className="flex gap-4 pt-6">
        <Link href={`/profile/${review.user.slug}`}>
          <Avatar className="w-12 h-12">
            <AvatarImage
              src={'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=' + review.user.nickname}
              alt={review.user.nickname}
            />
            <AvatarFallback>
              {getUserInitials(review.user.nickname || 'NO NICKNAME')}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 flex flex-col items-start">
          <div className="flex items-center gap-2 flex-wrap w-full justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                className="font-semibold hover:underline"
                href={`/profile/${review.user.slug}`}
              >
                {review.user.nickname}
              </Link>
              {review.user.roles.includes('admin') && (
                <Badge className="text-xs">Адміністратор</Badge>
              )}
              {review.user.roles.includes('editor') && <Badge className="text-xs">Редактор</Badge>}
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString('uk-UA')}
              </span>
            </div>
            {(onEdit || onDelete) && (
              <div className="flex gap-2">
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={onEdit}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="mt-2">
            <Stars rating={review.rating} maxRating={5} size={16} showNumber={false} />
          </div>
          <p className="mt-2 text-sm">{review.content}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="flex gap-4 pt-6">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewInputSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

async function handleDelete(reviewId: string | number, mutate: () => void) {
  if (!confirm('Ви впевнені, що хочете видалити цей відгук?')) {
    return
  }

  try {
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (res.ok) {
      mutate() // Refresh the list
    } else {
      console.error('Error deleting review:', await res.text())
      alert('Помилка при видаленні відгуку')
    }
  } catch (error) {
    console.error('Failed to delete review:', error)
    alert('Помилка при видаленні відгуку')
  }
}

export default Reviews
