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

/* ------------------------------------------------------------------ *
 * Бінарники (обкладинка + медіа з розділів)
 * ------------------------------------------------------------------ */

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** blob.type ненадійний (буває порожній), тому з фолбеком на розширення в URL. */
function detectMimeType(blobType: string, url: string): string {
  const fromBlob = blobType.split(';')[0].trim().toLowerCase()
  if (fromBlob && EXTENSION_BY_MIME[fromBlob]) {
    return fromBlob
  }

  let pathname = url
  try {
    pathname = new URL(url, window.location.href).pathname
  } catch {
    // не повноцінний URL — розбираємо рядок як є
  }
  const extension = pathname.split('.').pop()?.toLowerCase() ?? ''

  return MIME_BY_EXTENSION[extension] ?? 'image/jpeg'
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Прибираємо префікс data:image/xxx;base64,
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Збирає всі зображення книги в один набір <binary> елементів.
 * Дедуплікує за URL, тож та сама картинка вантажиться і вбудовується один раз.
 */
class BinaryStore {
  private tasks = new Map<string, Promise<string | null>>()
  private resolved = new Map<string, string | null>()
  private binaries: { id: string; contentType: string; data: string }[] = []
  private counter = 0

  /** Вантажить зображення (або віддає вже розпочату спробу) і повертає id бінарника. */
  load(url: string, preferredName?: string, signal?: AbortSignal): Promise<string | null> {
    const existing = this.tasks.get(url)
    if (existing) {
      return existing
    }

    const task = this.fetchAndStore(url, preferredName, signal)
    this.tasks.set(url, task)
    return task
  }

  /** Синхронний доступ до id — валідний лише після await відповідного load(). */
  idFor(url: string): string | null {
    return this.resolved.get(url) ?? null
  }

  toXml(): string {
    return this.binaries
      .map((b) => `  <binary id="${b.id}" content-type="${b.contentType}">${b.data}</binary>\n`)
      .join('')
  }

  private async fetchAndStore(
    url: string,
    preferredName: string | undefined,
    signal: AbortSignal | undefined,
  ): Promise<string | null> {
    try {
      const response = await fetch(url, { signal })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const contentType = detectMimeType(blob.type, url)
      const data = await blobToBase64(blob)

      const name = preferredName ?? `img${++this.counter}`
      const id = `${name}.${EXTENSION_BY_MIME[contentType] ?? 'jpg'}`

      this.binaries.push({ id, contentType, data })
      this.resolved.set(url, id)
      return id
    } catch (error) {
      if (isAbortError(error)) {
        throw error
      }
      // Одна побита картинка не має валити весь експорт
      console.error('Не вдалося вбудувати зображення:', url, error)
      this.resolved.set(url, null)
      return null
    }
  }
}

/* ------------------------------------------------------------------ *
 * HTML -> FB2
 * ------------------------------------------------------------------ */

const INDENT = '      '
const NBSP = ' '

function isListElement(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false
  const tag = (node as Element).tagName.toLowerCase()
  return tag === 'ul' || tag === 'ol'
}

/** Номер пункту: Lexical віддає його в value, інакше — рахунок сусідів + start у <ol>. */
function listItemNumber(item: Element): number {
  const explicit = Number(item.getAttribute('value'))
  if (Number.isInteger(explicit) && explicit > 0) {
    return explicit
  }

  const start = Number(item.parentElement?.getAttribute('start'))
  const base = Number.isInteger(start) && start > 0 ? start : 1

  let offset = 0
  let sibling = item.previousElementSibling
  while (sibling) {
    if (sibling.tagName.toLowerCase() === 'li') offset++
    sibling = sibling.previousElementSibling
  }

  return base + offset
}

function listItemMarker(item: Element): string {
  const parent = item.parentElement
  const parentClass = parent?.getAttribute('class') ?? ''

  if (item.hasAttribute('aria-checked') || parentClass.includes('list-check')) {
    return item.getAttribute('aria-checked') === 'true' ? '[x] ' : '[ ] '
  }

  if (parent?.tagName.toLowerCase() === 'ol' || parentClass.includes('list-number')) {
    return `${listItemNumber(item)}. `
  }

  return '• '
}

/**
 * Конвертує HTML розділу у вміст FB2 <section>.
 *
 * Ключова відмінність від «друку тегів на льоту»: інлайновий вміст спершу
 * накопичується в буфері, а блокові вузли скидають його в <p>. Завдяки цьому
 * будь-який невідомий тег (default-гілка) віддає свій текст у валідному
 * абзаці, а не голим рядком усередині <section>, який рідери просто викидають.
 */
async function htmlToFB2Section(
  html: string,
  binaries: BinaryStore,
  signal?: AbortSignal,
): Promise<string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Прохід 1: рендер нижче синхронний, тож медіа треба завантажити заздалегідь.
  const sources = Array.from(doc.querySelectorAll('img'))
    .map((img) => img.getAttribute('src'))
    .filter((src): src is string => Boolean(src))
  await Promise.all(sources.map((src) => binaries.load(src, undefined, signal)))

  // Прохід 2: власне конвертація.
  const out: string[] = []
  let inline = ''
  /** Маркер списку, який чекає на найближчий скид абзацу. */
  let pendingPrefix = ''
  let listDepth = 0

  function flushAs(tag: 'p' | 'subtitle'): void {
    const text = inline.trim()
    const prefix = pendingPrefix
    inline = ''
    pendingPrefix = ''
    if (text) {
      out.push(`${INDENT}<${tag}>${prefix}${text}</${tag}>\n`)
    }
  }

  function flush(): void {
    flushAs('p')
  }

  function block(xml: string): void {
    flush()
    out.push(`${INDENT}${xml}\n`)
  }

  function appendText(raw: string): void {
    if (!raw) return
    // \t від TabHTMLConverter інакше схлопнувся б до одного пробілу
    const normalized = raw.replace(/\t/g, NBSP.repeat(4)).replace(/[^\S ]+/g, ' ')
    // Пробіли між блоками ігноруємо, всередині абзацу — зберігаємо
    if (!inline && !normalized.trim()) return
    inline += escapeXml(normalized)
  }

  function processChildren(node: Node): void {
    node.childNodes.forEach(processNode)
  }

  function wrapInline(open: string, close: string, element: Element): void {
    inline += open
    processChildren(element)
    inline += close
  }

  function processImage(element: Element): void {
    const src = element.getAttribute('src')
    const id = src ? binaries.idFor(src) : null

    if (id) {
      block(`<image l:href="#${id}"/>`)
      return
    }

    // Картинку не вдалось вбудувати — лишаємо хоча б підпис
    const alt = element.getAttribute('alt')?.trim()
    if (alt) {
      appendText(alt)
      flush()
    }
  }

  function processListItem(element: Element): void {
    flush()

    const children = Array.from(element.childNodes)
    const indent = NBSP.repeat(2 * Math.max(0, listDepth - 1))

    pendingPrefix = escapeXml(indent + listItemMarker(element))
    children.filter((child) => !isListElement(child)).forEach(processNode)
    flush()
    pendingPrefix = ''

    // Вкладені списки — вже після власного тексту пункту
    children.filter(isListElement).forEach(processNode)
  }

  function processQuote(element: Element): void {
    flush()
    const start = out.length

    processChildren(element)
    flush()

    // <cite> без жодного абзацу невалідний, тож відкриваємо його лише за наявності вмісту
    if (out.length > start) {
      out.splice(start, 0, `${INDENT}<cite>\n`)
      out.push(`${INDENT}</cite>\n`)
    }
  }

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      appendText(node.textContent ?? '')
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    switch (tagName) {
      // --- блоки ---
      case 'p':
        flush()
        processChildren(element)
        flush()
        break

      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        flush()
        processChildren(element)
        flushAs('subtitle')
        break

      case 'blockquote':
        processQuote(element)
        break

      case 'ul':
      case 'ol':
        flush()
        listDepth++
        processChildren(element)
        listDepth--
        break

      case 'li':
        processListItem(element)
        break

      case 'br':
        // У FB2 немає інлайнового розриву: рядок закінчує абзац,
        // а порожній абзац із Lexical (<p><br /></p>) стає відступом.
        if (inline.trim()) {
          flush()
        } else {
          block('<empty-line/>')
        }
        break

      case 'hr':
        block('<empty-line/>')
        break

      case 'div':
      case 'figure':
      case 'figcaption':
        flush()
        processChildren(element)
        flush()
        break

      case 'img':
        processImage(element)
        break

      case 'source':
      case 'input':
        break

      // --- інлайн ---
      case 'strong':
      case 'b':
        wrapInline('<strong>', '</strong>', element)
        break

      case 'em':
      case 'i':
        wrapInline('<emphasis>', '</emphasis>', element)
        break

      case 's':
      case 'del':
      case 'strike':
        wrapInline('<strikethrough>', '</strikethrough>', element)
        break

      case 'u':
        wrapInline('<style name="underline">', '</style>', element)
        break

      case 'code':
        wrapInline('<code>', '</code>', element)
        break

      case 'sub':
        wrapInline('<sub>', '</sub>', element)
        break

      case 'sup':
        wrapInline('<sup>', '</sup>', element)
        break

      case 'a': {
        const href = element.getAttribute('href')
        if (href) {
          wrapInline(`<a l:href="${escapeXml(href)}">`, '</a>', element)
        } else {
          processChildren(element)
        }
        break
      }

      case 'span': {
        // Lexical віддає закреслення й підкреслення саме через inline-стилі
        const style = element.getAttribute('style') ?? ''
        if (style.includes('line-through')) {
          wrapInline('<strikethrough>', '</strikethrough>', element)
        } else if (style.includes('underline')) {
          wrapInline('<style name="underline">', '</style>', element)
        } else {
          processChildren(element)
        }
        break
      }

      default:
        processChildren(element)
    }
  }

  processNode(doc.body)
  flush()

  return out.join('')
}

export async function generateFB2(options: GenerateFB2Options): Promise<string> {
  const { book, onProgress, signal } = options

  const binaries = new BinaryStore()

  // Fetch cover if available
  let coverId: string | null = null
  const coverUrl = typeof book.coverImage === 'string' ? book.coverImage : book.coverImage?.url
  if (coverUrl) {
    onProgress?.(0, 0, 'Завантаження обкладинки...')
    coverId = await binaries.load(coverUrl, 'cover', signal)
  }

  // Fetch all chapters
  const chapters = await fetchChaptersInBatches(book.slug || '', onProgress, signal)

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  onProgress?.(chapters.length, chapters.length, 'Генерація FB2...')

  // Generate FB2 content
  const author =
    book.origin === 'original'
      ? (typeof book.owner === 'object' ? book.owner?.nickname : undefined) || 'Невідомий'
      : (typeof book.author === 'object' ? book.author?.name : book.author) || 'Невідомий'
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
      </annotation>${coverId ? `\n      <coverpage>\n        <image l:href="#${coverId}"/>\n      </coverpage>` : ''}
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

    let sectionContent = ''
    try {
      const html = convertLexicalToHTML({
        converters: htmlConverters,
        data: chapter.content,
      })

      sectionContent = await htmlToFB2Section(html, binaries, signal)
    } catch (error) {
      if (isAbortError(error)) {
        throw error
      }
      console.error(`Error converting chapter ${i}:`, error)
      sectionContent = `${INDENT}<p>Помилка конвертації розділу</p>\n`
    }

    // <section> без вмісту невалідний за схемою FB2
    fb2 += sectionContent || `${INDENT}<empty-line/>\n`

    fb2 += `    </section>
`
  }

  fb2 += `  </body>
`

  // Add binary data for cover and chapter media
  fb2 += binaries.toXml()

  fb2 += `</FictionBook>`

  onProgress?.(chapters.length, chapters.length, 'Завершено!')

  return fb2
}
