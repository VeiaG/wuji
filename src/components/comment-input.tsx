import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SanitizedMarkdown } from '@/components/SanitizedMarkdown'
import { useAuth } from '@/providers/auth'
import { X } from 'lucide-react'

type CommentInputProps = {
  chapterID: string
  parentID?: string // For nested replies
  onCommentSubmitted?: () => void
  placeholder?: string
  showCancel?: boolean
  onCancel?: () => void
}

const CommentInput: React.FC<CommentInputProps> = ({
  chapterID,
  parentID,
  onCommentSubmitted,
  placeholder = 'Коментувати...',
  showCancel = false,
  onCancel,
}) => {
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
          parent: parentID || null, // Add parent for nested replies
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
        console.error('Error submitting comment:', await res.text())
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
        <Tabs defaultValue="write" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write">Написати</TabsTrigger>
            <TabsTrigger value="preview">Попередній перегляд</TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="mt-2">
            <Textarea
              placeholder={parentID ? 'Відповісти на коментар...' : placeholder}
              className="w-full max-h-[300px]"
              maxLength={512}
              minLength={1}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-2">
            <div className="min-h-[100px] max-h-[300px] overflow-y-auto rounded-md border border-input bg-muted/50 p-3">
              {comment.trim() ? (
                <SanitizedMarkdown content={comment} />
              ) : (
                <p className="text-muted-foreground text-sm">Немає вмісту для попереднього перегляду</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 items-start mt-2">
          <div className="flex flex-col">
            <span className="text-foreground/80 block text-sm">{comment.length} / 512</span>
            {parentID && (
              <span className="text-xs text-muted-foreground">Відповідь на коментар</span>
            )}
          </div>
          <div className="flex gap-2 mt-1 items-center">
            {showCancel && onCancel && (
              <Button variant="ghost" disabled={isLoading} onClick={onCancel}>
                <X className="w-4 h-4 mr-1" />
                Скасувати
              </Button>
            )}
            <Button
              disabled={isLoading || comment.length < 1 || comment.length > 512}
              onClick={handleSubmit}
            >
              {isLoading ? 'Відправляємо...' : parentID ? 'Відповісти' : 'Відправити'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CommentInput
