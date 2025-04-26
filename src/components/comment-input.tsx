import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { useAuth } from '@/providers/auth'

type CommentInputProps = {
  chapterID: string
  onCommentSubmitted?: () => void // New prop for callback after submitting
}

const CommentInput: React.FC<CommentInputProps> = ({ chapterID, onCommentSubmitted }) => {
  const [comment, setComment] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!user) return
    if (comment.length < 1) return
    if (comment.length > 512) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/chapterComments', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          user: user.id,
          chapter: chapterID,
          content: comment,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (res.ok) {
        // Clear the comment field
        setComment('')

        // Call the callback to refresh comments
        if (onCommentSubmitted) {
          onCommentSubmitted()
        }
      } else {
        console.error('Error submitting comment')
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || !user) {
    return null
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <Textarea
          placeholder="Коментувати..."
          className="w-full max-h-[300px]"
          maxLength={512}
          minLength={1}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></Textarea>
        <div className="flex justify-between gap-2 items-start">
          <span className="text-foreground/80 block">{comment.length} / 512</span>
          <Button className="mt-1" disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Відправляємо...' : 'Відправити'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CommentInput
