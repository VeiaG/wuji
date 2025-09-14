import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, MessageSquareWarning } from 'lucide-react'
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
  const [complaintForm, setComplaintForm] = useState({
    type: '',
    description: '',
  })

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
    if (!complaintForm.type || !complaintForm.description || !savedSelectionData) {
      return
    }

    setIsSubmitting(true)

    try {
      const complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'> = {
        selectedText: savedSelectionData.text,
        complaintType: complaintForm.type as Complaint['complaintType'],
        description: complaintForm.description,
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

      setComplaintForm({ type: '', description: '' })
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
      setComplaintForm({ type: '', description: '' })
      window.getSelection()?.removeAllRanges()
    }
  }

  return (
    <>
      {/* Кнопка над менюшкою */}
      {text && (
        <div
          className={cn(
            'w-screen fixed left-0 bg-background/80 backdrop-blur-sm border-t transition-all duration-300',
            isOverlayHidden ? 'bottom-0' : 'bottom-[68px]', // 88px висота менюшки + padding
          )}
        >
          <div className="container mx-auto max-w-[800px] py-2 flex justify-center">
            <Button
              onClick={handleComplaintClick}
              size="sm"
              variant="outline"
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/50"
            >
              <MessageSquareWarning className="h-4 w-4" />
              Поскаржитись на переклад
            </Button>
          </div>
        </div>
      )}

      {/* Діалог скарги */}
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Скарга на переклад
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Виділений текст:</Label>
              <div className="p-3 bg-muted border border-border rounded-md text-sm max-h-32 overflow-y-auto">
                &quot;{savedSelectionData?.text || text}&quot;
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="complaint-type">Тип проблеми *</Label>
              <Select
                value={complaintForm.type}
                onValueChange={(value) => setComplaintForm((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Оберіть тип проблеми" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incorrect-translation">Неточний переклад</SelectItem>
                  <SelectItem value="grammatical-error">Граматична помилка</SelectItem>
                  <SelectItem value="terminology-inconsistency">
                    Невідповідність термінології
                  </SelectItem>
                  <SelectItem value="stylistic-issue">Стилістична проблема</SelectItem>
                  <SelectItem value="missing-text">Пропущений текст</SelectItem>
                  <SelectItem value="other">Інше</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Опис проблеми *</Label>
              <Textarea
                id="description"
                placeholder="Детально опишіть проблему з перекладом..."
                value={complaintForm.description}
                onChange={(e) =>
                  setComplaintForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isSubmitting}
            >
              Скасувати
            </Button>
            <Button
              onClick={handleSubmitComplaint}
              disabled={!complaintForm.type || !complaintForm.description || isSubmitting}
            >
              {isSubmitting ? 'Відправляємо...' : 'Відправити скаргу'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TextSelectionPopup
