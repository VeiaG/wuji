import type { CollectionSlug, Endpoint, RichTextField, UIField } from 'payload'
import { checkRole } from '@/collections/access/checkRole'
import { markdownToLexical } from '@/lib/markdown/markdownToLexical'

const MAX_MARKDOWN_LENGTH = 500_000

/**
 * Кнопка «Імпорт з Markdown» над richText-полем `target`.
 * Конвертація на сервері (потрібен санітизований editorConfig з фічами й блоками),
 * тому колекції треба також додати `markdownImportEndpoint(slug)`.
 */
export const markdownImportField = ({
  collection,
  target,
}: {
  collection: CollectionSlug
  target: string
}): UIField => ({
  name: `${target}MarkdownImport`,
  type: 'ui',
  admin: {
    components: {
      Field: {
        path: '@/components/admin/MarkdownImport/MarkdownImport.client#MarkdownImport',
        clientProps: { collection, target },
      },
    },
  },
})

export const markdownImportEndpoint = (collection: CollectionSlug): Endpoint => ({
  path: '/markdown-to-lexical',
  method: 'post',
  handler: async (req) => {
    if (!checkRole(['admin'], req.user)) {
      return Response.json({ error: 'Недостатньо прав' }, { status: 403 })
    }

    const body = (await req.json?.().catch(() => null)) as {
      field?: unknown
      markdown?: unknown
    } | null
    if (!body || typeof body.markdown !== 'string' || typeof body.field !== 'string') {
      return Response.json({ error: 'Очікується { field, markdown }' }, { status: 400 })
    }
    if (body.markdown.length > MAX_MARKDOWN_LENGTH) {
      return Response.json({ error: 'Markdown завеликий' }, { status: 413 })
    }

    const field = req.payload.collections[collection].config.fields.find(
      (f): f is RichTextField => f.type === 'richText' && f.name === body.field,
    )
    if (!field) {
      return Response.json({ error: `Немає richText-поля «${body.field}»` }, { status: 400 })
    }

    try {
      return Response.json({ state: markdownToLexical({ field, markdown: body.markdown }) })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Markdown import failed' })
      return Response.json({ error: 'Не вдалося конвертувати Markdown' }, { status: 422 })
    }
  },
})
