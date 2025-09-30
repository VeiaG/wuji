import { Book, BookChapter } from '@/payload-types'
import { stringify } from 'qs-esm'
import {
  convertLexicalToHTML,
  type HTMLConvertersFunction,
} from '@payloadcms/richtext-lexical/html'
import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'

interface GenerateFB2Options {
  book: Book
  onProgress?: (current: number, total: number, message: string) => void
  signal?: AbortSignal
}

const BATCH_SIZE = 500

type NodeTypes = DefaultNodeTypes

const htmlConverters: HTMLConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
})

async function fetchChaptersInBatches(
  bookSlug: string,
  onProgress?: (current: number, total: number, message: string) => void,
  signal?: AbortSignal,
): Promise<BookChapter[]> {
  // First, get total count
  const countQuery = stringify({
    where: { 'book.slug': { equals: bookSlug } },
    limit: 1,
  })

  const countReq = await fetch(`/api/bookChapters?${countQuery}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    signal,
  })
  const countData = await countReq.json()
  const totalCount = countData.totalDocs || 0

  if (totalCount === 0) {
    return []
  }

  onProgress?.(0, totalCount, 'Завантаження розділів...')

  const allChapters: BookChapter[] = []
  const totalBatches = Math.ceil(totalCount / BATCH_SIZE)

  for (let i = 0; i < totalBatches; i++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    const query = stringify({
      where: { 'book.slug': { equals: bookSlug } },
      select: {
        title: true,
        content: true,
        isSpoiler: true,
      },
      sort: '_bookChapters_chapters_order',
      limit: BATCH_SIZE,
      page: i + 1,
    })

    const req = await fetch(`/api/bookChapters?${query}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      signal,
    })

    const data = await req.json()
    if (data?.docs) {
      allChapters.push(...data.docs)
    }

    onProgress?.(
      allChapters.length,
      totalCount,
      `Завантажено ${allChapters.length} з ${totalCount} розділів...`,
    )
  }

  return allChapters
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function generateFB2(options: GenerateFB2Options): Promise<string> {
  const { book, onProgress, signal } = options

  // Fetch all chapters
  const chapters = await fetchChaptersInBatches(book.slug || '', onProgress, signal)

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  onProgress?.(chapters.length, chapters.length, 'Генерація FB2...')

  // Generate FB2 content
  const author = typeof book.author !== 'string' ? book.author.name : book.author
  const authorLastName = author.split(' ').pop() || author
  const authorFirstName = author.split(' ').slice(0, -1).join(' ') || ''

  const genres =
    book.genres?.map((g) => (typeof g === 'string' ? null : g.title))?.filter(Boolean) || []

  const description = book.meta?.description || ''

  // Start building FB2
  let fb2 = `<?xml version="1.0" encoding="UTF-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
  <description>
    <title-info>
      <genre>${escapeXml(genres[0] || 'prose')}</genre>
      <author>
        <first-name>${escapeXml(authorFirstName)}</first-name>
        <last-name>${escapeXml(authorLastName)}</last-name>
      </author>
      <book-title>${escapeXml(book.title)}</book-title>
      <annotation>
        <p>${escapeXml(description)}</p>
      </annotation>
      <lang>uk</lang>
    </title-info>
    <document-info>
      <author>
        <nickname>ranobes-ua</nickname>
      </author>
      <date>${new Date().toISOString().split('T')[0]}</date>
      <id>${book.id}</id>
      <version>1.0</version>
    </document-info>
  </description>
  <body>
    <title>
      <p>${escapeXml(book.title)}</p>
    </title>
`

  // Convert chapters
  for (let i = 0; i < chapters.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    const chapter = chapters[i]
    onProgress?.(i + 1, chapters.length, `Обробка розділу ${i + 1} з ${chapters.length}...`)

    fb2 += `    <section>
      <title>
        <p>${escapeXml(chapter.title)}</p>
      </title>
`

    try {
      const html = convertLexicalToHTML({
        converters: htmlConverters,
        data: chapter.content,
      })

      // Convert HTML to FB2 format
      // Replace HTML tags with FB2 equivalents
      const fb2Content = html
        // Remove wrapper divs/spans
        .replace(/<\/?div[^>]*>/g, '')
        .replace(/<\/?span[^>]*>/g, '')
        // Convert headings to FB2 title format
        .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '<title><p>$1</p></title>')
        // Keep paragraphs
        .replace(/<p[^>]*>(.*?)<\/p>/g, '<p>$1</p>')
        // Convert breaks to empty lines
        .replace(/<br\s*\/?>/g, '<empty-line/>')
        // Handle strong/bold
        .replace(/<strong[^>]*>(.*?)<\/strong>/g, '<strong>$1</strong>')
        .replace(/<b[^>]*>(.*?)<\/b>/g, '<strong>$1</strong>')
        // Handle emphasis/italic
        .replace(/<em[^>]*>(.*?)<\/em>/g, '<emphasis>$1</emphasis>')
        .replace(/<i[^>]*>(.*?)<\/i>/g, '<emphasis>$1</emphasis>')
        // Remove other HTML tags
        .replace(/<\/?[^>]+(>|$)/g, '')
        // Clean up multiple empty lines
        .replace(/(<empty-line\/>[\s\n]*){2,}/g, '<empty-line/>\n')
        .trim()

      // Split into lines and add proper indentation
      const lines = fb2Content.split('\n').filter((line) => line.trim())
      for (const line of lines) {
        // If line is not already a proper FB2 tag, wrap in <p>
        if (line.match(/^<(title|p|empty-line|subtitle)/)) {
          fb2 += `      ${line}\n`
        } else if (line.trim()) {
          fb2 += `      <p>${escapeXml(line)}</p>\n`
        }
      }
    } catch (error) {
      console.error(`Error converting chapter ${i}:`, error)
      fb2 += `      <p>Помилка конвертації розділу</p>\n`
    }

    fb2 += `    </section>
`
  }

  fb2 += `  </body>
</FictionBook>`

  onProgress?.(chapters.length, chapters.length, 'Завершено!')

  return fb2
}
