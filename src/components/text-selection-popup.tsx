import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageSquareWarning, X } from 'lucide-react'
import { Complaint } from '@/payload-types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Простий хук для виділення тексту
function useTextSelection(target?: HTMLElement) {
  const [selection, setSelection] = useState<{
    text: string
    range: Range | null
  }>({
    text: '',
    range: null,
  })

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection()

      if (!sel || sel.rangeCount === 0 || sel.toString().trim() === '') {
        setSelection({ text: '', range: null })
        return
      }

      const selectedText = sel.toString().trim()
      const range = sel.getRangeAt(0)

      // Перевіряємо чи виділення в межах target елемента
      if (target) {
        const rangeContainer = range.commonAncestorContainer
        let containerElement: Element

        if (rangeContainer.nodeType === Node.TEXT_NODE) {
          containerElement = rangeContainer.parentElement!
        } else {
          containerElement = rangeContainer as Element
        }

        const isWithinTarget = target.contains(containerElement) || target === containerElement

        if (!isWithinTarget) {
          setSelection({ text: '', range: null })
          return
        }
      }

      setSelection({
        text: selectedText,
        range: range.cloneRange(),
      })
    }

    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [target])

  return selection
}

// Компонент попапу
interface TextSelectionPopupProps {
  chapterId: string
  bookId?: string
  pageNumber: number
  target?: HTMLElement
  isOverlayHidden?: boolean // Чи схована менюшка
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({
  chapterId,
  pageNumber,
  target,
  bookId,
  isOverlayHidden = false,
}) => {
  const [showDialog, setShowDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [description, setDescription] = useState('')

  const [savedSelectionData, setSavedSelectionData] = useState<{
    text: string
    range: Range | null
    position: { start: number; end: number }
  } | null>(null)

  const { text, range } = useTextSelection(target)

  // Функція для обчислення позиції тексту
  const calculateTextPosition = (range: Range): { start: number; end: number } => {
    const textPosition = { start: 0, end: 0 }

    if (target && range) {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null)
      let textOffset = 0
      let node: Text | null

      while ((node = walker.nextNode() as Text)) {
        if (node === range.startContainer) {
          textPosition.start = textOffset + range.startOffset
        }
        if (node === range.endContainer) {
          textPosition.end = textOffset + range.endOffset
          break
        }
        textOffset += node.textContent?.length || 0
      }
    }

    return textPosition
  }

  const handleComplaintClick = () => {
    if (range) {
      setSavedSelectionData({
        text: text,
        range: range.cloneRange(),
        position: calculateTextPosition(range),
      })
    }
    setShowDialog(true)
  }

  const handleSubmitComplaint = async () => {
    if (!savedSelectionData) {
      return
    }

    setIsSubmitting(true)

    try {
      const complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'> = {
        selectedText: savedSelectionData.text,
        description: description.trim() || undefined,
        pageNumber,
        chapter: chapterId,
        book: bookId || '',
        position: savedSelectionData.position,
        status: 'pending',
      }

      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintData),
      })

      if (!response.ok) throw new Error('Network response was not ok')

      setDescription('')
      setSavedSelectionData(null)
      setShowDialog(false)
      window.getSelection()?.removeAllRanges()

      toast.success('Скаргу успішно відправлено. Дякуємо за ваш внесок!')
    } catch (error) {
      console.error('Помилка при відправці скарги:', error)
      toast.error('Не вдалося відправити скаргу. Спробуйте ще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setShowDialog(open)
    if (!open) {
      setSavedSelectionData(null)
      setDescription('')
      window.getSelection()?.removeAllRanges()
    }
  }

  const clearSelection = () => window.getSelection()?.removeAllRanges()
  const quote = savedSelectionData?.text || text

  return (
    <>
      {/* Плаваюча пігулка над панеллю читання (панель: 44px кнопки + 2×6px відступи) */}
      {text && !showDialog && (
        <div
          role="toolbar"
          aria-label="Дії з виділеним текстом"
          className={cn(
            'fixed inset-x-3 z-50 mx-auto max-w-[560px] animate-in fade-in-0 slide-in-from-bottom-2 transition-[bottom] duration-300',
            isOverlayHidden
              ? 'bottom-[max(12px,env(safe-area-inset-bottom))]'
              : 'bottom-[calc(max(12px,env(safe-area-inset-bottom))+66px)]',
          )}
        >
          <div className="flex items-center gap-1 rounded-[24px] bg-tile p-1.5 shadow-float">
            <p className="min-w-0 flex-1 truncate px-3 text-sm text-soft">
              «{text}»
            </p>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleComplaintClick}
              className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-[14px] bg-chip px-4 text-sm font-semibold text-foreground transition-colors hover:bg-chip/70"
            >
              <MessageSquareWarning className="size-[18px] text-primary" />
              Поскаржитись
            </button>
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Зняти виділення"
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-[14px] text-muted-foreground transition-colors hover:bg-chip hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      {/* Діалог скарги */}
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <div className="flex items-center gap-3 pr-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <MessageSquareWarning className="size-5" />
              </span>
              <div className="min-w-0 text-left">
                <DialogTitle className="text-lg font-bold leading-snug">
                  Скарга на переклад
                </DialogTitle>
                <DialogDescription className="text-[13px]">
                  Розділ {pageNumber} · редактори побачать виділений фрагмент
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <blockquote className="max-h-32 overflow-y-auto rounded-xl bg-chip px-4 py-3 text-sm leading-relaxed text-soft">
            {quote}
          </blockquote>

          <div className="flex flex-col gap-2">
            <Label htmlFor="complaint-description" className="text-sm font-semibold">
              Що не так?{' '}
              <span className="font-normal text-muted-foreground">— необов’язково</span>
            </Label>
            <Textarea
              id="complaint-description"
              placeholder="Наприклад, як має бути правильно — або залиште порожнім"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="min-h-28 resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={() => handleDialogClose(false)}
              disabled={isSubmitting}
            >
              Скасувати
            </Button>
            <Button
              onClick={handleSubmitComplaint}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Відправляємо…' : 'Відправити скаргу'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TextSelectionPopup
