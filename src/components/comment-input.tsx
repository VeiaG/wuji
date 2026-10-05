import React, { useEffect, useState } from 'react'
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
    <div className="flex flex-col gap-3 rounded-2xl bg-tile p-4">
      <Tabs defaultValue="write" className="w-full gap-3">
        <TabsList className="h-10">
          <TabsTrigger value="write" className="px-4">
            Написати
          </TabsTrigger>
          <TabsTrigger value="preview" className="px-4">
            Перегляд
          </TabsTrigger>
        </TabsList>

        <TabsContent value="write">
          <Textarea
            placeholder={parentID ? 'Відповісти на коментар...' : placeholder}
            className="min-h-24 w-full max-h-[300px] text-[15px] md:text-[15px]"
            maxLength={512}
            minLength={1}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </TabsContent>

        <TabsContent value="preview">
          <div className="min-h-24 max-h-[300px] overflow-y-auto rounded-xl bg-chip px-3 py-2 text-[15px] text-soft">
            {comment.trim() ? (
              <SanitizedMarkdown content={comment} />
            ) : (
              <p className="text-sm text-muted-foreground">Немає вмісту для попереднього перегляду</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[13px] text-muted-foreground tabular-nums">{comment.length} / 512</span>
          {parentID && (
            <span className="text-xs text-muted-foreground">Відповідь на коментар</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showCancel && onCancel && (
            <Button variant="ghost" disabled={isLoading} onClick={onCancel}>
              <X className="size-4" />
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
    </div>
  )
}

export default CommentInput
