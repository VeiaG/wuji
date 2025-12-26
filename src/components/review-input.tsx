'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SanitizedMarkdown } from '@/components/SanitizedMarkdown'
import { useAuth } from '@/providers/auth'
import { X } from 'lucide-react'
import Stars from './stars'
import { Review } from '@/payload-types'

type ReviewInputProps = {
  bookID: string
  onReviewSubmitted?: () => void
  existingReview?: Review | null
  onCancel?: () => void
}

const ReviewInput: React.FC<ReviewInputProps> = ({
  bookID,
  onReviewSubmitted,
  existingReview,
  onCancel,
}) => {
  const [content, setContent] = useState(existingReview?.content || '')
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const isEditing = !!existingReview

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (existingReview) {
      setContent(existingReview.content)
      setRating(existingReview.rating)
    }
  }, [existingReview])

  const handleSubmit = async () => {
    if (!user) return
    if (content.length < 1 || content.length > 1024) return
    if (rating < 1 || rating > 5) return

    setIsLoading(true)

    try {
      const method = isEditing ? 'PATCH' : 'POST'
      const url = isEditing ? `/api/reviews/${existingReview.id}` : '/api/reviews'

      const res = await fetch(url, {
        method,
        credentials: 'include',
        body: JSON.stringify({
          user: user.id,
          book: bookID,
          content,
          rating,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (res.ok) {
        setContent('')
        setRating(0)

        if (onReviewSubmitted) {
          onReviewSubmitted()
        }
      } else {
        const errorData = await res.json()
        console.error('Error submitting review:', errorData)

        // Check if it's a duplicate error
        if (errorData.errors?.[0]?.message?.includes('duplicate') ||
            errorData.errors?.[0]?.message?.includes('unique')) {
          alert('Ви вже залишили відгук на цю книгу. Ви можете відредагувати його у списку відгуків нижче.')
        } else {
          alert('Помилка при збереженні відгуку. Спробуйте ще раз.')
        }
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('Помилка при збереженні відгуку. Спробуйте ще раз.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient || !user) {
    return null
  }

  const isValid = content.length >= 1 && content.length <= 1024 && rating >= 1 && rating <= 5

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Редагувати відгук' : 'Залишити відгук'}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Ваш рейтинг</label>
          <Stars
            rating={rating}
            maxRating={5}
            size={32}
            showNumber={true}
            interactive={true}
            onRatingChange={setRating}
          />
          {rating === 0 && (
            <span className="text-xs text-muted-foreground">
              Оберіть рейтинг від 1 до 5 зірок
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Ваш відгук</label>
          <Tabs defaultValue="write" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">Написати</TabsTrigger>
              <TabsTrigger value="preview">Попередній перегляд</TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="mt-2">
              <Textarea
                placeholder="Напишіть свій відгук про книгу..."
                className="w-full max-h-[300px]"
                maxLength={1024}
                minLength={1}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-2">
              <div className="min-h-[100px] max-h-[300px] overflow-y-auto rounded-md border border-input bg-muted/50 p-3">
                {content.trim() ? (
                  <SanitizedMarkdown content={content} />
                ) : (
                  <p className="text-muted-foreground text-sm">Немає вмісту для попереднього перегляду</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <span className="text-foreground/80 text-sm">{content.length} / 1024</span>
        </div>

        <div className="flex justify-end gap-2">
          {isEditing && onCancel && (
            <Button variant="ghost" disabled={isLoading} onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              Скасувати
            </Button>
          )}
          <Button disabled={isLoading || !isValid} onClick={handleSubmit}>
            {isLoading ? 'Збереження...' : isEditing ? 'Зберегти' : 'Опублікувати'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ReviewInput
