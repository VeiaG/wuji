import type { CollectionSlug, GlobalSlug, Plugin } from 'payload'
import { mcpPlugin, type MCPPluginConfig } from '@payloadcms/plugin-mcp'
import { checkRole } from '@/collections/access/checkRole'
import { getServerSideURL } from '@/lib/getURL'

type CollectionsMap = NonNullable<MCPPluginConfig['collections']>
type GlobalsMap = NonNullable<MCPPluginConfig['globals']>

// Усі вбудовані інструменти v4 — щоб вимкнути колекцію/глобал повністю
const COLLECTION_TOOLS_OFF = {
  count: false,
  countVersions: false,
  create: false,
  delete: false,
  duplicate: false,
  find: false,
  findDistinct: false,
  findVersionByID: false,
  findVersions: false,
  getCollectionSchema: false,
  getUploadInstructions: false,
  restoreVersion: false,
  update: false,
} as const

const GLOBAL_TOOLS_OFF = {
  countGlobalVersions: false,
  find: false,
  findGlobalVersionByID: false,
  findGlobalVersions: false,
  getGlobalSchema: false,
  restoreGlobalVersion: false,
  update: false,
} as const

// Що відкрито через MCP. Усе, чого тут немає, вимикається повністю (у v4 плагін
// за замовчуванням відкриває все). Персональні дані (users, readProgress, bookmarks,
// notifications, user-uploads) свідомо не відкриваємо.
const collections: CollectionsMap = {
  books: { description: 'Книги (веб-новели) каталогу' },
  bookChapters: { description: 'Розділи книг' },
  authors: { description: 'Автори оригінальних творів' },
  bookGenres: { description: 'Жанри книг' },
  posts: { description: 'Пости блогу' },
  pages: { description: 'Статичні сторінки сайту' },
  media: {
    description: 'Зображення (обкладинки, картинки в постах)',
    // лише читання
    tools: {
      create: false,
      update: false,
      delete: false,
      duplicate: false,
      getUploadInstructions: false,
      restoreVersion: false,
    },
  },
  chapterComments: { description: 'Коментарі читачів до розділів' },
  reviews: { description: 'Відгуки читачів на книги' },
  complaints: { description: 'Скарги користувачів' },
}

const globals: GlobalsMap = {
  'home-page': { description: 'Налаштування головної сторінки' },
  banner: { description: 'Банер над сайтом' },
  footer: { description: 'Футер сайту' },
}

/**
 * MCP-сервер Payload (`POST /api/mcp`).
 *
 * Вхід — через OAuth (Payload як authorization server, увімкнено за замовчуванням).
 * API-ключів у Users немає (`auth.useAPIKey` вимкнено), тож клієнти, налаштовані на ключ,
 * треба перепідключити через OAuth. Користуватися MCP можуть лише адміни; інструменти
 * виконуються від імені користувача з `overrideAccess: false`, тож звичайні
 * access-правила колекцій діють і тут. `authStrategies` (токени Google) для MCP
 * закрито на рівні поля в Users.
 */
// Плагін v4 — об'єкт із `slug` (definePlugin), тож обгорнути його функцією не можна:
// усі slug'и конфігу передаємо явно, щоб вимкнути все поза allowlist
export const mcp = ({
  collectionSlugs,
  globalSlugs,
}: {
  collectionSlugs: string[]
  globalSlugs: string[]
}): Plugin => {
  const allCollections: CollectionsMap = {}
  for (const slug of collectionSlugs) {
    allCollections[slug as CollectionSlug] = collections[slug as CollectionSlug] ?? {
      tools: COLLECTION_TOOLS_OFF,
    }
  }

  const allGlobals: GlobalsMap = {}
  for (const slug of globalSlugs) {
    allGlobals[slug as GlobalSlug] = globals[slug as GlobalSlug] ?? { tools: GLOBAL_TOOLS_OFF }
  }

  return mcpPlugin({
    access: ({ req }) => checkRole(['admin'], req.user),
    collections: allCollections,
    globals: allGlobals,
    oauth: {
      type: 'builtin',
      // `serverURL` у конфігу свідомо не задано (ламає фронт), а без нього плагін бере
      // адресу з `req.url` — за проксі це `https://0.0.0.0:3000`, і OAuth-метадані
      // (issuer, authorize, token) ведуть у нікуди. Тому публічну адресу задаємо тут.
      resource: () => `${getServerSideURL().replace(/\/$/, '')}/api/mcp`,
    },
  })
}
