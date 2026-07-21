'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'
import { canEditBook } from '@/collections/access/checkRole'
import type { BookChapter, User } from '@/payload-types'

// Обмеження на довжину regex-патерну, щоб уникнути дорогих/небезпечних виразів
// (catastrophic backtracking) при синхронній заміні по всьому тексту розділів.
const MAX_REGEX_PATTERN_LENGTH = 500

export type ReplaceInput = {
  /** slug книги, в розділах якої виконується заміна */
  slug: string
  /** що шукати */
  find: string
  /** на що замінювати (порожній рядок = видалення) */
  replace: string
  /** інтерпретувати `find` як регулярний вираз */
  useRegex?: boolean
  /** враховувати регістр */
  caseSensitive?: boolean
  /** true — лише попередній перегляд, зміни не зберігаються */
  dryRun: boolean
}

export type ChapterReplaceResult = {
  id: string
  title: string
  /** кількість збігів у розділі */
  count: number
  /** фрагмент навколо першого збігу до заміни */
  previewBefore: string
  /** той самий фрагмент після заміни */
  previewAfter: string
}

export type ReplaceResponse =
  | {
      ok: true
      dryRun: boolean
      chapters: ChapterReplaceResult[]
      totalReplacements: number
      changedChapters: number
    }
  | { ok: false; error: string }

// Екрануємо спецсимволи, щоб `find` в звичайному режимі трактувався буквально
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildRegex(find: string, useRegex: boolean, caseSensitive: boolean): RegExp {
  const flags = caseSensitive ? 'g' : 'gi'
  const pattern = useRegex ? find : escapeRegExp(find)
  return new RegExp(pattern, flags)
}

function makeSnippet(text: string, index: number, length: number): string {
  if (index < 0) return text.slice(0, 120)
  const start = Math.max(0, index - 60)
  const end = Math.min(text.length, index + length + 60)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

/**
 * Глобальний пошук-заміна по тексту всіх розділів книги.
 *
 * Ідея: кожен розділ конвертуємо Lexical -> Markdown, робимо заміну по markdown
 * (регулярним виразом або буквально), і конвертуємо Markdown -> Lexical назад.
 * Зручно для видалення артефактів перекладу простою заміною на порожній рядок.
 *
 * Оскільки round-trip через markdown може бути неточним для складного форматування,
 * спершу завжди варто виконати `dryRun` (попередній перегляд), і лише потім зберігати.
 */
export async function replaceInChapters(input: ReplaceInput): Promise<ReplaceResponse> {
  const { slug, find, useRegex = false, caseSensitive = false, dryRun } = input
  const replace = input.replace ?? ''

  if (!slug) return { ok: false, error: 'Не вказано книгу' }
  if (!find) return { ok: false, error: 'Поле «Знайти» не може бути порожнім' }
  if (useRegex && find.length > MAX_REGEX_PATTERN_LENGTH) {
    return {
      ok: false,
      error: `Регулярний вираз задовгий (максимум ${MAX_REGEX_PATTERN_LENGTH} символів)`,
    }
  }

  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  const bookRes = await payload.find({
    collection: 'books',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const book = bookRes.docs?.[0]
  if (!book) return { ok: false, error: 'Книгу не знайдено' }

  if (!canEditBook((user as User) || null, book)) {
    return { ok: false, error: 'У вас немає доступу до редагування цієї книги' }
  }

  let regex: RegExp
  try {
    regex = buildRegex(find, useRegex, caseSensitive)
  } catch {
    return { ok: false, error: 'Некоректний регулярний вираз' }
  }

  // У буквальному режимі екрануємо `$`, щоб String.replace не трактував його як спецпослідовність
  const replacement = useRegex ? replace : replace.replace(/\$/g, '$$$$')

  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  const chaptersRes = await payload.find({
    collection: 'bookChapters',
    where: { book: { equals: book.id } },
    select: { title: true, content: true },
    sort: '_bookChapters_chapters_order',
    limit: 0,
    depth: 0,
  })

  const results: ChapterReplaceResult[] = []
  let totalReplacements = 0

  for (const chapter of chaptersRes.docs) {
    let markdown: string
    try {
      markdown = convertLexicalToMarkdown({
        data: chapter.content as SerializedEditorState,
        editorConfig,
      })
    } catch (error) {
      console.error(`replaceInChapters: не вдалося конвертувати розділ ${chapter.id}`, error)
      continue
    }

    const matches = markdown.match(regex)
    const count = matches ? matches.length : 0
    if (count === 0) continue

    const newMarkdown = markdown.replace(regex, replacement)

    const firstMatch = matches![0]
    const idx = markdown.indexOf(firstMatch)
    const previewBefore = makeSnippet(markdown, idx, firstMatch.length)
    // Текст до першого збігу не змінюється, тому `idx` валідний і для нового markdown
    const previewAfter = makeSnippet(newMarkdown, idx, replacement.length)

    if (!dryRun) {
      const lexicalJSON = convertMarkdownToLexical({ editorConfig, markdown: newMarkdown })
      await payload.update({
        collection: 'bookChapters',
        id: chapter.id,
        data: {
          content: lexicalJSON as unknown as BookChapter['content'],
        },
        overrideAccess: false,
        user,
        context: { skipRecountingChapters: true },
      })
    }

    totalReplacements += count
    results.push({
      id: String(chapter.id),
      title: chapter.title,
      count,
      previewBefore,
      previewAfter,
    })
  }

  if (!dryRun && results.length > 0) {
    revalidatePath(`/novel/${slug}/editor`)
  }

  return {
    ok: true,
    dryRun,
    chapters: results,
    totalReplacements,
    changedChapters: results.length,
  }
}
