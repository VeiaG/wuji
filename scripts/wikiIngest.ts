/**
 * Wiki ingest pipeline. Extracts wiki entries / mentions / relations from book
 * chapters with a local LLM (Ollama), and can compose wiki articles from the
 * accumulated evidence.
 *
 * Usage (runs via tsx, `payload run` swallows CLI args):
 *   pnpm wiki:ingest --slug prynts-drakona-yuan
 *   pnpm wiki:ingest --slug prynts-drakona-yuan --from 10 --to 50 --model qwen3:8b
 *   pnpm wiki:ingest --slug prynts-drakona-yuan --mode compose
 *
 * Every flag can also be passed as an env var (WIKI_SLUG, WIKI_FROM, WIKI_TO,
 * WIKI_MODE, WIKI_MODEL, WIKI_LIMIT, OLLAMA_URL).
 *
 * Resumable & idempotent:
 * - processed chapter numbers are tracked in ./wiki-ingest/<slug>.json and a
 *   chapter is marked processed ONLY after all its writes finished, so killing
 *   the script mid-chapter just means that chapter is redone next run;
 * - DB writes are upserts guarded by the unique indexes on the wiki
 *   collections, so redoing a chapter never creates duplicates;
 * - Ctrl+C once = finish current chapter and exit, twice = exit immediately.
 */
import { promises as fs } from 'fs'
import path from 'path'

import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

import type { WikiEntry } from '@/payload-types'
import { formatSlug } from '@/fields/slug/formatSlug'

// ---------------------------------------------------------------------------
// CLI / env options
// ---------------------------------------------------------------------------

const getArg = (name: string, envName: string): string | undefined => {
  const argv = process.argv
  const eq = argv.find((a) => a.startsWith(`--${name}=`))
  if (eq) return eq.split('=').slice(1).join('=')
  const idx = argv.indexOf(`--${name}`)
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) return argv[idx + 1]
  return process.env[envName]
}

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`)

const options = {
  slug: getArg('slug', 'WIKI_SLUG'),
  mode: (getArg('mode', 'WIKI_MODE') || 'ingest') as 'ingest' | 'compose',
  from: Number(getArg('from', 'WIKI_FROM') || 1),
  to: Number(getArg('to', 'WIKI_TO') || 0), // 0 = till the last chapter
  limit: Number(getArg('limit', 'WIKI_LIMIT') || 0), // 0 = no limit per run
  model: getArg('model', 'WIKI_MODEL') || 'qwen3:8b',
  ollamaUrl: getArg('ollama', 'OLLAMA_URL') || 'http://localhost:11434',
  numCtx: Number(getArg('ctx', 'WIKI_NUM_CTX') || 16384),
  temperature: Number(getArg('temperature', 'WIKI_TEMPERATURE') || 0.2),
  minMentions: Number(getArg('min-mentions', 'WIKI_MIN_MENTIONS') || 2),
  entrySlug: getArg('entry', 'WIKI_ENTRY'), // compose a single entry
  force: hasFlag('force'), // reprocess chapters even if marked as done
}

const PROMPT_VERSION = 'v1'
const MAX_CHAPTER_CHARS = 20000
const STATE_DIR = path.resolve('./wiki-ingest')

if (!options.slug) {
  console.error(
    'Usage: pnpm wiki:ingest --slug <book-slug> [--from N] [--to N] [--limit N] [--model qwen3:8b] [--mode ingest|compose] [--force]',
  )
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Graceful stop (Ctrl+C)
// ---------------------------------------------------------------------------

let stopRequested = false
process.on('SIGINT', () => {
  if (stopRequested) {
    console.log('\nЗупиняюсь негайно. Поточний розділ буде перероблено наступного разу.')
    process.exit(130)
  }
  stopRequested = true
  console.log('\nЗавершую поточний розділ і зупиняюсь... (Ctrl+C ще раз — вийти негайно)')
})

// ---------------------------------------------------------------------------
// Script state file (resume support)
// ---------------------------------------------------------------------------

type IngestState = {
  bookId: string
  processedChapters: number[]
  updatedAt: string
}

const stateFilePath = (slug: string) => path.join(STATE_DIR, `${slug}.json`)

const loadState = async (slug: string, bookId: string): Promise<IngestState> => {
  try {
    const raw = await fs.readFile(stateFilePath(slug), 'utf-8')
    const state = JSON.parse(raw) as IngestState
    if (state.bookId !== bookId) {
      console.warn('State file belongs to another book id, starting fresh.')
      return { bookId, processedChapters: [], updatedAt: new Date().toISOString() }
    }
    return state
  } catch {
    return { bookId, processedChapters: [], updatedAt: new Date().toISOString() }
  }
}

const saveState = async (slug: string, state: IngestState): Promise<void> => {
  await fs.mkdir(STATE_DIR, { recursive: true })
  state.updatedAt = new Date().toISOString()
  const target = stateFilePath(slug)
  const tmp = `${target}.tmp`
  // write + rename so a killed process can't leave a truncated state file
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), 'utf-8')
  await fs.rename(tmp, target)
}

// ---------------------------------------------------------------------------
// Lexical -> plain text
// ---------------------------------------------------------------------------

type LexicalNode = {
  text?: string
  type?: string
  children?: LexicalNode[]
}

const lexicalToText = (content: unknown): string => {
  const root = (content as { root?: LexicalNode })?.root
  if (!root) return ''

  const walk = (node: LexicalNode): string => {
    if (typeof node.text === 'string') return node.text
    if (node.type === 'linebreak') return '\n'
    if (!node.children) return ''
    const inner = node.children.map(walk).join('')
    return inner
  }

  return (root.children || [])
    .map(walk)
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n\n')
}

// ---------------------------------------------------------------------------
// Ollama structured-output call
// ---------------------------------------------------------------------------

const ollamaChat = async <T>(params: {
  system: string
  user: string
  schema: Record<string, unknown>
}): Promise<T> => {
  const { system, user, schema } = params
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${options.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model,
          stream: false,
          format: schema,
          options: {
            temperature: options.temperature,
            num_ctx: options.numCtx,
          },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      })
      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`)
      }
      const data = (await res.json()) as { message?: { content?: string } }
      const raw = (data.message?.content || '')
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/```json|```/g, '')
        .trim()
      return JSON.parse(raw) as T
    } catch (error) {
      lastError = error
      console.warn(`  LLM attempt ${attempt}/3 failed:`, (error as Error).message)
    }
  }
  throw lastError
}

// ---------------------------------------------------------------------------
// Extraction prompt & schema
// ---------------------------------------------------------------------------

const ENTITY_TYPES = [
  'character',
  'location',
  'organization',
  'technique',
  'item',
  'realm',
  'event',
  'concept',
] as const

const MENTION_TYPES = [
  'appearance',
  'dialogue',
  'backstory',
  'power-up',
  'relationship-change',
  'death',
  'item-acquired',
  'location-visited',
  'realm-change',
  'other',
] as const

const RELATION_TYPES = [
  'related-to',
  'teacher-of',
  'parent-of',
  'sibling-of',
  'friend-of',
  'enemy-of',
  'ally-of',
  'rival-of',
  'romantic-interest-of',
  'member-of',
  'leader-of',
  'owner-of',
  'user-of',
  'located-in',
  'participant-in',
] as const

// relation types where A→B and B→A mean the same fact; direction is normalized
const SYMMETRIC_RELATIONS = new Set([
  'related-to',
  'sibling-of',
  'friend-of',
  'enemy-of',
  'ally-of',
  'rival-of',
  'romantic-interest-of',
])

type ExtractionResult = {
  entities: {
    name: string
    type: (typeof ENTITY_TYPES)[number]
    aliases?: string[]
    shortDescription?: string
  }[]
  mentions: {
    entityName: string
    rawName?: string
    mentionType: (typeof MENTION_TYPES)[number]
    quote?: string
    context?: string
    confidence?: number
  }[]
  relations: {
    sourceName: string
    targetName: string
    type: (typeof RELATION_TYPES)[number]
    note?: string
    confidence?: number
  }[]
}

const extractionSchema = {
  type: 'object',
  required: ['entities', 'mentions', 'relations'],
  properties: {
    entities: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { enum: [...ENTITY_TYPES] },
          aliases: { type: 'array', items: { type: 'string' } },
          shortDescription: { type: 'string' },
        },
      },
    },
    mentions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['entityName', 'mentionType'],
        properties: {
          entityName: { type: 'string' },
          rawName: { type: 'string' },
          mentionType: { enum: [...MENTION_TYPES] },
          quote: { type: 'string' },
          context: { type: 'string' },
          confidence: { type: 'number' },
        },
      },
    },
    relations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['sourceName', 'targetName', 'type'],
        properties: {
          sourceName: { type: 'string' },
          targetName: { type: 'string' },
          type: { enum: [...RELATION_TYPES] },
          note: { type: 'string' },
          confidence: { type: 'number' },
        },
      },
    },
  },
}

const extractionSystemPrompt = `You are a precise information-extraction engine for a Ukrainian-language web novel (ranobe). You read ONE chapter and return wiki data as JSON.

Rules:
- All names, aliases, descriptions and notes MUST be in Ukrainian, exactly as spelled in the chapter text.
- If an entity from KNOWN ENTITIES appears in the chapter, reuse its listed name EXACTLY as "name" / "entityName" / "sourceName" / "targetName". Never invent a new spelling variant for a known entity.
- Only extract entities that matter for a story wiki: named characters, locations, organizations/sects/clans, techniques/abilities, items/artifacts, cultivation realms, major events, key concepts. Skip generic unnamed things.
- "entities" must list every entity you reference in mentions/relations (known or new).
- "mentions": one item per entity that actually appears or is discussed in this chapter. rawName = the exact wording used in the text. quote = short verbatim quote, max 200 characters. context = one sentence about what this chapter reveals about the entity.
- "relations": only clear relations stated in the text, between entities from your "entities" list. Directions: teacher-of (source teaches target), parent-of (source is the parent), member-of (source is a member of target organization), leader-of (source leads target), owner-of (source owns target), user-of (source uses target technique), located-in (source is inside target), participant-in (source takes part in target event). For symmetric types (related-to, sibling-of, friend-of, enemy-of, ally-of, rival-of, romantic-interest-of) direction does not matter.
- confidence: number 0..1.
- Return ONLY JSON matching the schema. No commentary.`

// ---------------------------------------------------------------------------
// Entry registry (in-memory matching of names -> wikiEntries)
// ---------------------------------------------------------------------------

type EntryRef = {
  id: string
  title: string
  type: string
  status: string
  aliases: string[]
}

const normName = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, ' ')

class EntryRegistry {
  byName = new Map<string, EntryRef>()
  byId = new Map<string, EntryRef>()

  add(entry: EntryRef) {
    this.byId.set(entry.id, entry)
    for (const key of [entry.title, ...entry.aliases]) {
      const norm = normName(key)
      if (norm && !this.byName.has(norm)) this.byName.set(norm, entry)
    }
  }

  resolve(name: string): EntryRef | undefined {
    return this.byName.get(normName(name))
  }

  /** Compact list for the LLM prompt: "Назва (type) [aliases]" */
  promptList(max = 400): string {
    const refs = [...this.byId.values()].slice(-max)
    if (refs.length === 0) return '(поки що порожньо)'
    return refs
      .map((r) => `- ${r.title} (${r.type})${r.aliases.length ? ` [${r.aliases.join(', ')}]` : ''}`)
      .join('\n')
  }
}

const loadRegistry = async (payload: Payload, bookId: string): Promise<EntryRegistry> => {
  const registry = new EntryRegistry()
  const result = await payload.find({
    collection: 'wikiEntries',
    where: { novel: { equals: bookId } },
    pagination: false,
    limit: 0,
    depth: 0,
    select: { title: true, type: true, status: true, aliases: true },
  })
  for (const doc of result.docs) {
    registry.add({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      status: doc.status,
      aliases: doc.aliases || [],
    })
  }
  return registry
}

// ---------------------------------------------------------------------------
// Ingest: apply one chapter's extraction to the DB (all writes are upserts)
// ---------------------------------------------------------------------------

type ChapterInfo = { id: string; index: number; title: string }

type Counters = {
  createdEntries: number
  updatedEntries: number
  createdMentions: number
  createdRelations: number
}

const applyExtraction = async (params: {
  payload: Payload
  bookId: string
  chapter: ChapterInfo
  extraction: ExtractionResult
  registry: EntryRegistry
  counters: Counters
}): Promise<void> => {
  const { payload, bookId, chapter, extraction, registry, counters } = params

  // 1. Upsert entities
  for (const entity of extraction.entities || []) {
    if (!entity?.name?.trim()) continue
    const existing = registry.resolve(entity.name)

    if (!existing) {
      const data = {
        novel: bookId,
        type: ENTITY_TYPES.includes(entity.type) ? entity.type : ('concept' as const),
        title: entity.name.trim(),
        slug: formatSlug(entity.name),
        aliases: (entity.aliases || []).map((a) => a.trim()).filter(Boolean),
        shortDescription: entity.shortDescription || undefined,
        firstAppearanceIndex: chapter.index,
        spoilerChapterIndex: chapter.index,
        lastProcessedChapterIndex: chapter.index,
        status: 'auto' as const,
        generatedBy: `ollama:${options.model}`,
      }
      let created: WikiEntry
      try {
        created = await payload.create({ collection: 'wikiEntries', data, depth: 0 })
      } catch {
        // most likely a slug collision (different titles, same transliteration)
        created = await payload.create({
          collection: 'wikiEntries',
          data: { ...data, slug: `${formatSlug(data.title)}-${chapter.index}` },
          depth: 0,
        })
      }
      registry.add({
        id: created.id,
        title: created.title,
        type: created.type,
        status: created.status,
        aliases: created.aliases || [],
      })
      counters.createdEntries++
    } else if (existing.status === 'auto') {
      // merge aliases / fill description, never rewrite human-touched entries
      const newAliases = (entity.aliases || [])
        .map((a) => a.trim())
        .filter((a) => a && !registry.resolve(a))
      const update: Record<string, unknown> = {
        lastProcessedChapterIndex: chapter.index,
        generatedBy: `ollama:${options.model}`,
      }
      if (newAliases.length) update.aliases = [...existing.aliases, ...newAliases]
      await payload.update({
        collection: 'wikiEntries',
        id: existing.id,
        data: update,
        depth: 0,
      })
      if (newAliases.length) {
        existing.aliases.push(...newAliases)
        registry.add(existing)
      }
      counters.updatedEntries++
    }
  }

  // 2. Upsert mentions (unique per entry + chapterIndex + rawName)
  for (const mention of extraction.mentions || []) {
    const entry = registry.resolve(mention.entityName || '')
    if (!entry) continue
    const rawName = (mention.rawName || mention.entityName).trim().slice(0, 200)

    const existing = await payload.find({
      collection: 'wikiMentions',
      where: {
        and: [
          { entry: { equals: entry.id } },
          { chapterIndex: { equals: chapter.index } },
          { rawName: { equals: rawName } },
        ],
      },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length > 0) continue

    await payload.create({
      collection: 'wikiMentions',
      depth: 0,
      data: {
        novel: bookId,
        entry: entry.id,
        chapter: chapter.id,
        chapterIndex: chapter.index,
        rawName,
        mentionType: MENTION_TYPES.includes(mention.mentionType) ? mention.mentionType : 'other',
        quote: mention.quote?.slice(0, 500) || undefined,
        context: mention.context || undefined,
        confidence: clamp01(mention.confidence),
        source: 'ai',
      },
    })
    counters.createdMentions++
  }

  // 3. Upsert relations (unique per novel + source + target + type)
  for (const relation of extraction.relations || []) {
    if (!RELATION_TYPES.includes(relation.type)) continue
    let source = registry.resolve(relation.sourceName || '')
    let target = registry.resolve(relation.targetName || '')
    if (!source || !target || source.id === target.id) continue

    // canonical direction for symmetric relations: lower id first
    if (SYMMETRIC_RELATIONS.has(relation.type) && source.id > target.id) {
      ;[source, target] = [target, source]
    }

    const existing = await payload.find({
      collection: 'wikiRelations',
      where: {
        and: [
          { novel: { equals: bookId } },
          { sourceEntry: { equals: source.id } },
          { targetEntry: { equals: target.id } },
          { type: { equals: relation.type } },
        ],
      },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length > 0) continue

    await payload.create({
      collection: 'wikiRelations',
      depth: 0,
      data: {
        novel: bookId,
        sourceEntry: source.id,
        targetEntry: target.id,
        type: relation.type,
        chapterIndex: chapter.index,
        note: relation.note || undefined,
        confidence: clamp01(relation.confidence),
      },
    })
    counters.createdRelations++
  }
}

const clamp01 = (n: unknown): number | undefined => {
  if (typeof n !== 'number' || Number.isNaN(n)) return undefined
  return Math.max(0, Math.min(1, n))
}

// ---------------------------------------------------------------------------
// Ingest mode
// ---------------------------------------------------------------------------

const runIngest = async (payload: Payload, bookId: string, slug: string): Promise<void> => {
  // ordered chapter list; array position + 1 == the same 1-based chapter
  // number that reader URLs and readProgress use
  const chaptersResult = await payload.find({
    collection: 'bookChapters',
    where: { book: { equals: bookId } },
    sort: '_bookChapters_chapters_order',
    pagination: false,
    limit: 0,
    depth: 0,
    select: { title: true },
  })
  const chapters: ChapterInfo[] = chaptersResult.docs.map((doc, i) => ({
    id: doc.id,
    index: i + 1,
    title: doc.title,
  }))
  if (chapters.length === 0) {
    console.error('У книги немає розділів.')
    return
  }

  const state = await loadState(slug, bookId)
  const processed = new Set(state.processedChapters)
  const from = Math.max(1, options.from)
  const to = options.to > 0 ? Math.min(options.to, chapters.length) : chapters.length

  const queue = chapters.filter(
    (c) => c.index >= from && c.index <= to && (options.force || !processed.has(c.index)),
  )
  const limited = options.limit > 0 ? queue.slice(0, options.limit) : queue

  console.log(
    `Розділів у книзі: ${chapters.length}. Діапазон ${from}-${to}, уже оброблено ${processed.size}, у черзі: ${limited.length}.`,
  )
  if (limited.length === 0) {
    console.log('Нема чого обробляти. (--force щоб переобробити)')
    return
  }

  const registry = await loadRegistry(payload, bookId)
  console.log(`Відомих вікі-записів: ${registry.byId.size}. Модель: ${options.model}.`)

  const run = await payload.create({
    collection: 'wikiIngestRuns',
    depth: 0,
    data: {
      label: `${slug} • ch ${limited[0].index}-${limited[limited.length - 1].index} • ${options.model}`,
      novel: bookId,
      status: 'running',
      provider: 'ollama',
      model: options.model,
      fromChapterIndex: limited[0].index,
      toChapterIndex: limited[limited.length - 1].index,
      promptVersion: PROMPT_VERSION,
      settings: {
        numCtx: options.numCtx,
        temperature: options.temperature,
        ollamaUrl: options.ollamaUrl,
        force: options.force,
      },
    },
  })

  const counters: Counters = {
    createdEntries: 0,
    updatedEntries: 0,
    createdMentions: 0,
    createdRelations: 0,
  }
  const failed: number[] = []
  let processedCount = 0
  let consecutiveFailures = 0

  for (const chapter of limited) {
    if (stopRequested) break

    const startedAt = Date.now()
    try {
      const chapterDoc = await payload.findByID({
        collection: 'bookChapters',
        id: chapter.id,
        depth: 0,
      })
      let text = lexicalToText(chapterDoc.content)
      if (text.length > MAX_CHAPTER_CHARS) {
        console.warn(
          `  Розділ ${chapter.index} довший за ${MAX_CHAPTER_CHARS} символів, обрізаю (${text.length}).`,
        )
        text = text.slice(0, MAX_CHAPTER_CHARS)
      }

      const extraction = await ollamaChat<ExtractionResult>({
        system: extractionSystemPrompt,
        user: `KNOWN ENTITIES:\n${registry.promptList()}\n\nCHAPTER ${chapter.index}: ${chapter.title}\n\n${text}`,
        schema: extractionSchema,
      })

      await applyExtraction({ payload, bookId, chapter, extraction, registry, counters })

      // the chapter is done — only now mark it as processed
      processed.add(chapter.index)
      state.processedChapters = [...processed].sort((a, b) => a - b)
      await saveState(slug, state)

      processedCount++
      consecutiveFailures = 0
      console.log(
        `✓ Розділ ${chapter.index}/${to} «${chapter.title}» за ${Math.round((Date.now() - startedAt) / 1000)}с ` +
          `(сутностей: ${extraction.entities?.length || 0}, згадок: ${extraction.mentions?.length || 0}, зв'язків: ${extraction.relations?.length || 0})`,
      )
    } catch (error) {
      consecutiveFailures++
      failed.push(chapter.index)
      console.error(`✗ Розділ ${chapter.index} не вдався:`, (error as Error).message)
      if (consecutiveFailures >= 3) {
        console.error('3 невдачі поспіль — схоже, Ollama лежить. Зупиняюсь.')
        break
      }
    }

    // keep the run doc up to date so progress is visible in the admin panel
    try {
      await payload.update({
        collection: 'wikiIngestRuns',
        id: run.id,
        depth: 0,
        data: {
          processedChapters: processedCount,
          failedChapterIndexes: failed,
          ...counters,
        },
      })
    } catch {
      // non-fatal
    }
  }

  const finalStatus =
    failed.length > 0 || stopRequested || processedCount < limited.length
      ? consecutiveFailures >= 3 && processedCount === 0
        ? 'failed'
        : 'partial'
      : 'completed'

  await payload.update({
    collection: 'wikiIngestRuns',
    id: run.id,
    depth: 0,
    data: {
      status: finalStatus,
      finishedAt: new Date().toISOString(),
      processedChapters: processedCount,
      failedChapterIndexes: failed,
      ...counters,
      error: failed.length ? `Failed chapters: ${failed.join(', ')}` : undefined,
    },
  })

  console.log(
    `\nГотово (${finalStatus}). Оброблено розділів: ${processedCount}/${limited.length}. ` +
      `Записів: +${counters.createdEntries}/~${counters.updatedEntries}, згадок: +${counters.createdMentions}, зв'язків: +${counters.createdRelations}.` +
      (failed.length ? `\nНевдалі розділи (повторяться наступним запуском): ${failed.join(', ')}` : ''),
  )
}

// ---------------------------------------------------------------------------
// Compose mode: mentions + relations -> Markdown article -> Lexical
// ---------------------------------------------------------------------------

type ComposeResult = { markdown: string; shortDescription: string }

const composeSchema = {
  type: 'object',
  required: ['markdown', 'shortDescription'],
  properties: {
    markdown: { type: 'string' },
    shortDescription: { type: 'string' },
  },
}

const composeSystemPrompt = `You write wiki articles in Ukrainian for a web-novel fan wiki. Based on the entry data and chronological evidence (mentions extracted from chapters), write a concise wiki article as Markdown.

Rules:
- Ukrainian language only.
- Start with a 1-2 sentence lead paragraph (no heading), then "##" sections where it makes sense (Опис, Історія, Здібності, Стосунки...).
- Use ONLY facts from the provided evidence. No speculation, no filler.
- Do NOT repeat the entry title as a heading.
- Reference chapters like "(розділ 12)" when describing events.
- "shortDescription": 1-2 sentences without major spoilers.
- Return ONLY JSON matching the schema.`

const runCompose = async (payload: Payload, bookId: string): Promise<void> => {
  const editorConfig = await editorConfigFactory.default({ config: await config })
  const registry = await loadRegistry(payload, bookId)

  const entriesResult = await payload.find({
    collection: 'wikiEntries',
    where: {
      and: [
        { novel: { equals: bookId } },
        { status: { equals: 'auto' } },
        ...(options.entrySlug ? [{ slug: { equals: options.entrySlug } }] : []),
      ],
    },
    pagination: false,
    limit: 0,
    depth: 0,
  })

  console.log(`Кандидатів на генерацію статей: ${entriesResult.docs.length}.`)
  let composed = 0
  let skipped = 0

  for (const entry of entriesResult.docs) {
    if (stopRequested) break

    const mentionsResult = await payload.find({
      collection: 'wikiMentions',
      where: { entry: { equals: entry.id } },
      sort: 'chapterIndex',
      pagination: false,
      limit: 0,
      depth: 0,
    })
    const mentions = mentionsResult.docs

    if (mentions.length < options.minMentions) {
      skipped++
      continue
    }

    const upToChapter = mentions[mentions.length - 1].chapterIndex
    const metadata = (entry.metadata || {}) as Record<string, unknown>
    // idempotency: skip if the article already covers all known evidence
    if (
      typeof metadata.composedUpToChapter === 'number' &&
      metadata.composedUpToChapter >= upToChapter &&
      !options.force
    ) {
      skipped++
      continue
    }

    const relationsResult = await payload.find({
      collection: 'wikiRelations',
      where: {
        or: [{ sourceEntry: { equals: entry.id } }, { targetEntry: { equals: entry.id } }],
      },
      pagination: false,
      limit: 0,
      depth: 0,
    })

    const evidence = mentions
      .map(
        (m) =>
          `- [розділ ${m.chapterIndex}] (${m.mentionType}) ${m.context || ''}${m.quote ? ` Цитата: «${m.quote}»` : ''}`,
      )
      .join('\n')

    const relationLines = relationsResult.docs
      .map((r) => {
        const sourceId = typeof r.sourceEntry === 'string' ? r.sourceEntry : r.sourceEntry.id
        const targetId = typeof r.targetEntry === 'string' ? r.targetEntry : r.targetEntry.id
        const other = registry.byId.get(sourceId === entry.id ? targetId : sourceId)
        if (!other) return null
        const direction = sourceId === entry.id ? '→' : '←'
        return `- ${r.type} ${direction} ${other.title}${r.note ? ` (${r.note})` : ''}`
      })
      .filter(Boolean)
      .join('\n')

    try {
      const result = await ollamaChat<ComposeResult>({
        system: composeSystemPrompt,
        user:
          `ENTRY: ${entry.title} (${entry.type})\n` +
          `ALIASES: ${(entry.aliases || []).join(', ') || '—'}\n\n` +
          `EVIDENCE (chronological):\n${evidence}\n\n` +
          `RELATIONS:\n${relationLines || '—'}`,
        schema: composeSchema,
      })

      if (!result.markdown?.trim()) throw new Error('LLM повернула порожню статтю')

      const lexical = convertMarkdownToLexical({
        editorConfig,
        markdown: result.markdown,
      })

      await payload.update({
        collection: 'wikiEntries',
        id: entry.id,
        depth: 0,
        data: {
          content: lexical as WikiEntry['content'],
          shortDescription: entry.shortDescription || result.shortDescription || undefined,
          generatedBy: `ollama:${options.model}`,
          metadata: { ...metadata, composedUpToChapter: upToChapter },
        },
      })
      composed++
      console.log(`✓ ${entry.title} (${mentions.length} згадок, до розділу ${upToChapter})`)
    } catch (error) {
      console.error(`✗ ${entry.title}:`, (error as Error).message)
    }
  }

  console.log(`\nГотово. Статей згенеровано: ${composed}, пропущено: ${skipped}.`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  const payload = await getPayload({ config })

  const bookResult = await payload.find({
    collection: 'books',
    where: { slug: { equals: options.slug } },
    limit: 1,
    pagination: false,
    depth: 0,
  })
  const book = bookResult.docs[0]
  if (!book) {
    console.error(`Книгу зі слагом "${options.slug}" не знайдено.`)
    process.exit(1)
  }
  console.log(`Книга: ${book.title} (${book.id}). Режим: ${options.mode}.`)

  if (options.mode === 'compose') {
    await runCompose(payload, book.id)
  } else {
    await runIngest(payload, book.id, options.slug!)
  }
}

await main()
process.exit(0)
