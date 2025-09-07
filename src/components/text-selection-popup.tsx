import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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

// Простий хук для виділення тексту
function useTextSelection(target?: HTMLElement) {
  const [selection, setSelection] = useState<{
    text: string
    rect: DOMRect | null
    range: Range | null
  }>({
    text: '',
    rect: null,
    range: null,
  })

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection()

      if (!sel || sel.rangeCount === 0) {
        setSelection({ text: '', rect: null, range: null })
        return
      }

      const selectedText = sel.toString().trim()

      if (selectedText.length === 0) {
        setSelection({ text: '', rect: null, range: null })
        return
      }

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
          setSelection({ text: '', rect: null, range: null })
          return
        }
      }

      const rect = range.getBoundingClientRect()

      if (rect.width === 0 && rect.height === 0) {
        setSelection({ text: '', rect: null, range: null })
        return
      }

      setSelection({
        text: selectedText,
        rect: rect,
        range: range.cloneRange(),
      })
    }

    const handleClick = () => {
      // Невелика затримка щоб дати час на обробку нового виділення
      setTimeout(handleSelectionChange, 50)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleSelectionChange)
    document.addEventListener('touchend', handleSelectionChange)
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleSelectionChange)
      document.removeEventListener('touchend', handleSelectionChange)
      document.removeEventListener('click', handleClick)
    }
  }, [target])

  return selection
}

// Portal компонент
function Portal({ children, mount }: { children: React.ReactNode; mount?: HTMLElement }) {
  return createPortal(children, mount || document.body)
}

// Компонент попапу
interface TextSelectionPopupProps {
  chapterId: string
  bookId?: string
  pageNumber: number
  target?: HTMLElement
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({
  chapterId,
  pageNumber,
  target,
  bookId,
}) => {
  const [showDialog, setShowDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [complaintForm, setComplaintForm] = useState({
    type: '',
    description: '',
  })

  // Стан для збереження даних виділення при відкритті діалогу
  const [savedSelectionData, setSavedSelectionData] = useState<{
    text: string
    range: Range | null
    position: { start: number; end: number }
  } | null>(null)

  const selection = useTextSelection(target)
  const popupRef = useRef<HTMLDivElement>(null)

  // Обробка кліків поза попапом
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        // Перевіряємо чи є активне виділення
        setTimeout(() => {
          const sel = window.getSelection()
          if (!sel || sel.toString().trim() === '') {
            // Виділення зникло, можемо приховати попап
          }
        }, 50)
      }
    }

    if (selection.text) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selection.text])

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
    // Зберігаємо дані поточного виділення перед відкриттям діалогу
    if (selection.range) {
      setSavedSelectionData({
        text: selection.text,
        range: selection.range.cloneRange(),
        position: calculateTextPosition(selection.range),
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      // Очищуємо форму та закриваємо діалог
      setComplaintForm({ type: '', description: '' })
      setSavedSelectionData(null)
      setShowDialog(false)

      // Прибираємо виділення
      window.getSelection()?.removeAllRanges()
      toast.success('Скаргу успішно відправлено. Дякуємо за ваш внесок!')
    } catch (error) {
      console.error('Помилка при відправці скарги:', error)
      toast.error('Не вдалося відправити скаргу. Спробуйте ще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Обробка закриття діалогу
  const handleDialogClose = (open: boolean) => {
    setShowDialog(open)
    if (!open) {
      // Очищуємо збережені дані при закритті діалогу
      setSavedSelectionData(null)
      setComplaintForm({ type: '', description: '' })
    }
  }

  // Рендер попапу
  const renderPopup = () => {
    if (!selection.text || !selection.rect) return null

    const popupStyle: React.CSSProperties = {
      position: 'fixed',
      left: selection.rect.left + selection.rect.width / 2,
      top: selection.rect.top - 10,
      transform: 'translateX(-50%) translateY(-100%)',
      zIndex: 50,
    }

    return (
      <div
        ref={popupRef}
        style={popupStyle}
        className="bg-background border border-border rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleComplaintClick}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/50"
        >
          <MessageSquareWarning className="h-4 w-4" />
          Поскаржитись на переклад
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Попап через Portal */}
      <Portal>{renderPopup()}</Portal>

      {/* Діалог скарги */}
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Скарга на переклад
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Виділений текст */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Виділений текст:</Label>
              <div className="p-3 bg-muted border border-border rounded-md text-sm max-h-32 overflow-y-auto">
                &quot;{savedSelectionData?.text || selection.text}&quot;
              </div>
            </div>

            {/* Тип скарги */}
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

            {/* Опис проблеми */}
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
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSubmitting}>
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
