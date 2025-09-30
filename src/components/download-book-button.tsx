'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Book } from '@/payload-types'
import { generateFB2 } from '@/lib/fb2-generator'
import { useAuth } from '@/providers/auth'

interface DownloadBookButtonProps {
  book: Book
  className?: string
}
// Поки що лише для адмінів, потім скоріше всього доступ буде для усіх.
// В принципі охочі можуть вже взяти скрипт і скачати собі книгу, якщо дуже треба. :)
// API відкритий усім
export default function DownloadBookButton({ book, className }: DownloadBookButtonProps) {
  const { user } = useAuth()

  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleDownload = async (_format: 'fb2') => {
    if (isDownloading) return

    setIsDownloading(true)
    setProgress(0)
    setStatus('Початок завантаження...')

    abortControllerRef.current = new AbortController()

    try {
      const fileContent = await generateFB2({
        book,
        onProgress: (current, total, message) => {
          setProgress(Math.round((current / total) * 100))
          setStatus(message)
        },
        signal: abortControllerRef.current.signal,
      })

      // Create and download file
      const blob = new Blob([fileContent], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${book.slug || 'book'}.fb2`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('Завершено!')
      setTimeout(() => {
        setIsDownloading(false)
        setProgress(0)
        setStatus('')
      }, 2000)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setStatus('Скасовано')
      } else {
        setStatus('Помилка завантаження')
        console.error('Download error:', error)
      }
      setTimeout(() => {
        setIsDownloading(false)
        setProgress(0)
        setStatus('')
      }, 2000)
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }
  // Only show download button for admins
  if (!user || !user.roles?.includes('admin')) {
    return null
  }

  if (isDownloading) {
    return (
      <div className={className}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{status}</span>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} />
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Завантажити
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleDownload('fb2')}>Формат FB2</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
