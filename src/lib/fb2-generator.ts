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

async function getCoverBase64(coverUrl: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(coverUrl, { signal })
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        // Remove data:image/xxx;base64, prefix
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error loading cover:', error)
    return null
  }
}

function htmlToFB2Paragraphs(html: string): string {
  // Create a DOM parser
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  let result = ''

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        result += escapeXml(text)
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    switch (tagName) {
      case 'p':
        result += '      <p>'
        Array.from(element.childNodes).forEach(processNode)
        result += '</p>\n'
        break

      case 'br':
        result += '<empty-line/>\n'
        break

      case 'strong':
      case 'b':
        result += '<strong>'
        Array.from(element.childNodes).forEach(processNode)
        result += '</strong>'
        break

      case 'em':
      case 'i':
        result += '<emphasis>'
        Array.from(element.childNodes).forEach(processNode)
        result += '</emphasis>'
        break

      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        result += '      <subtitle>'
        Array.from(element.childNodes).forEach(processNode)
        result += '</subtitle>\n'
        break

      case 'div':
      case 'span':
      case 'body':
        // Just process children
        Array.from(element.childNodes).forEach(processNode)
        break

      default:
        // For unknown tags, just process children
        Array.from(element.childNodes).forEach(processNode)
    }
  }

  processNode(doc.body)

  // Clean up empty paragraphs and extra whitespace
  result = result.replace(/<p>\s*<\/p>/g, '').replace(/\n{3,}/g, '\n\n')

  return result
}

export async function generateFB2(options: GenerateFB2Options): Promise<string> {
  const { book, onProgress, signal } = options

  // Fetch cover if available
  let coverBase64: string | null = null
  const coverUrl = typeof book.coverImage === 'string' ? book.coverImage : book.coverImage?.url
  if (coverUrl) {
    onProgress?.(0, 0, 'Завантаження обкладинки...')
    coverBase64 = await getCoverBase64(coverUrl, signal)
  }

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
      </annotation>${coverBase64 ? '\n      <coverpage>\n        <image l:href="#cover.jpg"/>\n      </coverpage>' : ''}
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

      // // Save first chapter HTML for debugging
      // if (i === 0) {
      //   console.log('=== FIRST CHAPTER HTML OUTPUT ===')
      //   console.log(html)
      //   console.log('=== END OF HTML OUTPUT ===')

      //   // Also save to a downloadable file
      //   const blob = new Blob([html], { type: 'text/html' })
      //   const url = URL.createObjectURL(blob)
      //   const a = document.createElement('a')
      //   a.href = url
      //   a.download = 'first-chapter-debug.html'
      //   a.click()
      //   URL.revokeObjectURL(url)
      // }

      // Convert HTML to FB2 format using proper DOM parsing
      const fb2Content = htmlToFB2Paragraphs(html)
      fb2 += fb2Content
    } catch (error) {
      console.error(`Error converting chapter ${i}:`, error)
      fb2 += `      <p>Помилка конвертації розділу</p>\n`
    }

    fb2 += `    </section>
`
  }

  fb2 += `  </body>
`

  // Add binary data for cover if available
  if (coverBase64) {
    fb2 += `  <binary id="cover.jpg" content-type="image/jpeg">${coverBase64}</binary>
`
  }

  fb2 += `</FictionBook>`

  onProgress?.(chapters.length, chapters.length, 'Завершено!')

  return fb2
}
