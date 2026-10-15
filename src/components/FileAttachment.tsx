import { BookOpen, Download, File, FileArchive, FileText } from 'lucide-react'
import type { File as FileDoc } from '@/payload-types'
import { cn } from '@/lib/utils'

const sizeFormat = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 })

const formatSize = (bytes?: number | null) => {
  if (!bytes) return null
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${sizeFormat.format(value)} ${units[unit]}`
}

function FileIcon({ mimeType }: { mimeType?: null | string }) {
  const className = 'size-5'
  if (mimeType === 'application/epub+zip') return <BookOpen className={className} />
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('7z'))
    return <FileArchive className={className} />
  if (mimeType === 'application/pdf' || mimeType?.startsWith('text/') || mimeType?.includes('document'))
    return <FileText className={className} />
  return <File className={className} />
}

type Props = {
  file: Pick<FileDoc, 'filename' | 'filesize' | 'mimeType' | 'title' | 'url'>
  className?: string
}

/** Вкладений файл у пості: іконка, назва, формат і розмір, кнопка завантаження */
export default function FileAttachment({ file, className }: Props) {
  if (!file.url) return null
  const extension = file.filename?.split('.').pop()?.toUpperCase()
  const meta = [extension, formatSize(file.filesize)].filter(Boolean).join(' · ')

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      download={file.filename ?? true}
      className={cn(
        'not-prose group my-6 flex items-center gap-3.5 rounded-tile-sm bg-chip p-3 pr-4 no-underline transition-colors hover:bg-chip/70',
        className,
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-background text-primary">
        <FileIcon mimeType={file.mimeType} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-foreground">{file.title || file.filename}</span>
        {meta && <span className="text-[13px] text-muted-foreground">{meta}</span>}
      </span>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors group-hover:text-foreground">
        <Download className="size-5" aria-hidden />
        <span className="sr-only">Завантажити</span>
      </span>
    </a>
  )
}
