'use client'

import React, { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Replace, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  replaceInChapters,
  type ReplaceResponse,
  type ChapterReplaceResult,
} from '@/actions/chapterReplace'

type Props = {
  slug: string
}

const ChapterReplace: React.FC<Props> = ({ slug }) => {
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [preserveCase, setPreserveCase] = useState(false)

  const [preview, setPreview] = useState<Extract<ReplaceResponse, { ok: true }> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [isPending, startTransition] = useTransition()

  const run = (dryRun: boolean) => {
    setError(null)
    startTransition(async () => {
      const res = await replaceInChapters({
        slug,
        find,
        replace,
        useRegex,
        caseSensitive,
        preserveCase,
        dryRun,
      })
      if (!res.ok) {
        setError(res.error)
        setPreview(null)
        return
      }
      setPreview(res)
      setApplied(!dryRun)
    })
  }

  const handleCaseSensitiveChange = (checked: boolean) => {
    setCaseSensitive(checked)
    // Підлаштовувати регістр немає під що, коли збіг завжди точний
    if (checked) setPreserveCase(false)
  }

  const handlePreview = () => {
    setApplied(false)
    run(true)
  }

  const handleApply = () => {
    setConfirmOpen(false)
    run(false)
  }

  const disabled = isPending || !find

  return (
    <div className="flex flex-col gap-4 border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2">
        <Replace className="h-4 w-4" />
        <h2 className="font-bold text-lg">Глобальна заміна по тексту розділів</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Заміна виконується по всьому тексту розділів цієї книги: контент конвертується в Markdown,
        робиться заміна, і конвертується назад. Зручно прибирати артефакти перекладу заміною на
        порожнє поле. Спершу натисніть «Переглянути», щоб перевірити збіги, і лише потім
        застосовуйте.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="replace-find">Знайти</Label>
          <Input
            id="replace-find"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder={useRegex ? 'регулярний вираз' : 'текст для пошуку'}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="replace-with">Замінити на</Label>
          <Input
            id="replace-with"
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="залиште порожнім, щоб видалити"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch id="replace-regex" checked={useRegex} onCheckedChange={setUseRegex} />
          <Label htmlFor="replace-regex" className="cursor-pointer">
            Регулярний вираз
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="replace-case"
            checked={caseSensitive}
            onCheckedChange={handleCaseSensitiveChange}
          />
          <Label htmlFor="replace-case" className="cursor-pointer">
            Враховувати регістр
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="replace-preserve-case"
            checked={preserveCase}
            onCheckedChange={setPreserveCase}
            disabled={caseSensitive}
          />
          <Label
            htmlFor="replace-preserve-case"
            className={
              caseSensitive ? 'text-muted-foreground/60 cursor-not-allowed' : 'cursor-pointer'
            }
          >
            Зберігати регістр
          </Label>
        </div>
      </div>

      <p className="text-sm text-muted-foreground -mt-2">
        {caseSensitive ? (
          <>
            «Зберігати регістр» доступне лише коли регістр не враховується — інакше збіг завжди має
            той самий регістр, що й запит.
          </>
        ) : (
          <>
            «Зберігати регістр» підлаштовує заміну під знайдене слово: <code>слово</code> →{' '}
            <code>{(replace || 'заміна').toLowerCase()}</code>, <code>Слово</code> →{' '}
            <code>{capitalize(replace || 'заміна')}</code>, <code>СЛОВО</code> →{' '}
            <code>{(replace || 'заміна').toUpperCase()}</code>. Тобто одна заміна замість двох
            окремих.
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={handlePreview} disabled={disabled}>
          {isPending && !confirmOpen ? 'Обробка…' : 'Переглянути'}
        </Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={disabled || !preview || preview.totalReplacements === 0 || applied}
        >
          Застосувати
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {preview && (
        <div className="flex flex-col gap-3">
          <div className="text-sm">
            {applied ? (
              <span className="text-green-600 font-medium">
                Готово. Замінено {preview.totalReplacements}{' '}
                {pluralMatches(preview.totalReplacements)} у {preview.changedChapters}{' '}
                {pluralChapters(preview.changedChapters)}.
              </span>
            ) : preview.totalReplacements === 0 ? (
              <span className="text-muted-foreground">Збігів не знайдено.</span>
            ) : (
              <span>
                Знайдено {preview.totalReplacements} {pluralMatches(preview.totalReplacements)} у{' '}
                {preview.changedChapters} {pluralChapters(preview.changedChapters)}. Перевірте зміни
                нижче та натисніть «Застосувати».
              </span>
            )}
          </div>

          {preview.chapters.length > 0 && (
            <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
              {preview.chapters.map((chapter) => (
                <ChapterPreviewRow key={chapter.id} chapter={chapter} applied={applied} />
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Застосувати заміну?</AlertDialogTitle>
            <AlertDialogDescription>
              {preview
                ? `Буде змінено ${preview.changedChapters} ${pluralChapters(
                    preview.changedChapters,
                  )} (${preview.totalReplacements} ${pluralMatches(
                    preview.totalReplacements,
                  )}). Цю дію не можна скасувати автоматично.`
                : 'Цю дію не можна скасувати автоматично.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply}>Застосувати</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const ChapterPreviewRow: React.FC<{ chapter: ChapterReplaceResult; applied: boolean }> = ({
  chapter,
  applied,
}) => {
  return (
    <div className="border rounded-md p-3 bg-background flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-sm truncate">{chapter.title}</h3>
        <Badge variant="secondary" className="shrink-0">
          {chapter.count} {pluralMatches(chapter.count)}
        </Badge>
      </div>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex gap-2">
          <span className="text-muted-foreground shrink-0 w-12">Було:</span>
          <span className="whitespace-pre-wrap break-words text-red-600/90">
            {chapter.previewBefore}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground shrink-0 w-12">
            {applied ? 'Стало:' : 'Буде:'}
          </span>
          <span className="whitespace-pre-wrap break-words text-green-600/90">
            {chapter.previewAfter}
          </span>
        </div>
      </div>
    </div>
  )
}

// Робить великою першу літеру — лише для підказки в описі режиму
function capitalize(value: string): string {
  return value.replace(/\p{L}/u, (letter) => letter.toUpperCase())
}

function pluralMatches(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'збіг'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'збіги'
  return 'збігів'
}

function pluralChapters(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'розділі'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'розділах'
  return 'розділах'
}

export default ChapterReplace
