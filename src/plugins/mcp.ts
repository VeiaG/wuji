import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { admins } from '@/collections/access/admins'
import { hiddenUnlessRole } from '@/collections/access/hidden'

/**
 * MCP-сервер Payload (`POST /api/mcp`, `Authorization: Bearer <ключ>`).
 *
 * Ключі видають лише адміни. Інструменти виконуються від імені власника ключа
 * з `overrideAccess: false`, тож звичайні access-правила колекцій діють і тут.
 * Перелік нижче — це лише стеля можливостей; конкретні дозволи
 * вмикаються галочками в самому ключі.
 *
 * Персональні дані (users, readProgress, bookmarks, notifications, user-uploads)
 * свідомо не відкриваємо.
 */
export const mcp = () =>
  mcpPlugin({
    collections: {
      books: { enabled: true, description: 'Книги (веб-новели) каталогу' },
      bookChapters: { enabled: true, description: 'Розділи книг' },
      authors: { enabled: true, description: 'Автори оригінальних творів' },
      bookGenres: { enabled: true, description: 'Жанри книг' },
      posts: { enabled: true, description: 'Пости блогу' },
      pages: { enabled: true, description: 'Статичні сторінки сайту' },
      media: { enabled: { find: true }, description: 'Зображення (обкладинки, картинки в постах)' },
      chapterComments: { enabled: true, description: 'Коментарі читачів до розділів' },
      reviews: { enabled: true, description: 'Відгуки читачів на книги' },
      complaints: { enabled: true, description: 'Скарги користувачів' },
    },
    globals: {
      'home-page': { enabled: true, description: 'Налаштування головної сторінки' },
      banner: { enabled: true, description: 'Банер над сайтом' },
      footer: { enabled: true, description: 'Футер сайту' },
    },
    overrideApiKeyCollection: (collection) => ({
      ...collection,
      access: {
        ...collection.access,
        create: admins,
        read: admins,
        update: admins,
        delete: admins,
        unlock: admins,
      },
      admin: {
        ...collection.admin,
        hidden: hiddenUnlessRole(['admin']),
      },
    }),
  })
