import { s3Storage } from '@payloadcms/storage-s3'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { ensureChapterOrderIndex } from './lib/db/ensureChapterOrderIndex'
// import { payloadCloudPlugin } from '@payloadcms/payload-cloud'

import { FixedToolbarFeature, LinkFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { linkableCollections } from './lib/docPath'
import path from 'path'
import { buildConfig, type CollectionConfig, type GlobalConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Files } from './collections/Files'
import { BookGenres } from './collections/BookGenres'
import { Books } from './collections/Book'
import { Authors } from './collections/Authors'
import { BookChapters } from './collections/BookChapters'
import { BookRequests } from './collections/BookRequests'
import { Post } from './collections/Post'
import { ReadProgress } from './collections/ReadProgress'
import { ChapterComment } from './collections/ChapterComment'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { en } from '@payloadcms/translations/languages/en'
import { uk } from '@payloadcms/translations/languages/uk'
import { customTranslations } from './translations'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Bookmarks } from './collections/Bookmarks'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import Complaints from './collections/Complaints'
import { Reviews } from './collections/Reviews'
import { algoliaSearchPlugin } from '@veiag/payload-algolia-search'
import { UserUploads } from './collections/UserUploads'
import { Notifications } from './collections/Notifications'
import { Pages } from './collections/Pages'
import Banner from './collections/globals/Banner'
import HomePage from './collections/globals/HomePage'
import Footer from './collections/globals/Footer'
import GeneralSettings from './collections/globals/GeneralSettings'
import { seedAboutPage } from './seed/aboutPage'
import { seedFooter } from './seed/footer'
import { payloadEnhancedSidebar } from '@veiag/payload-enhanced-sidebar'
import { sidebarTabAccess } from './collections/access/sidebar'
import { MAX_UPLOAD_FILE_SIZE_MB, mbToBytes } from './lib/uploadLimits'
import { clientConfigPlugin } from './plugins/client-config'
import { mcp } from './plugins/mcp'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const collections: CollectionConfig[] = [
  Users,
  Media,
  Files,
  BookGenres,
  Books,
  Authors,
  BookChapters,
  BookRequests,
  Post,
  ReadProgress,
  ChapterComment,
  Bookmarks,
  Complaints,
  Reviews,
  UserUploads,
  Notifications,
  Pages,
]
const globals: GlobalConfig[] = [Banner, HomePage, Footer, GeneralSettings]

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    theme: 'dark',
    meta: {
      titleSuffix: ' — ВуЧи',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' }],
    },
    avatar: { Component: '@/components/admin/branding/AdminAvatar#AdminAvatar' },
    components: {
      graphics: {
        Icon: '@/components/admin/branding/Icon',
        Logo: '@/components/admin/branding/Logo',
      },
      afterLogin: ['@/components/admin/GoogleLoginButton#GoogleLoginButton'],
      // шапка поруч із breadcrumbs: повернення на сайт (зручно в PWA на телефоні)
      actions: ['@/components/admin/BackToSite/BackToSite#BackToSite'],
      // палітра сайту: data-palette з localStorage, як на фронтенді
      providers: ['@/components/admin/palette/PaletteProvider#PaletteProvider'],
      // меню користувача: «Палітра» + «Вийти» (верхній рівень доступний лише через цей слот)
      logout: { Button: '@/components/admin/palette/UserMenuEnd#UserMenuEnd' },
      views: {
        complaintsReview: {
          Component: '@/components/admin/ComplaintsReview/ComplaintsReview#ComplaintsReview',
          path: '/complaints-review',
        },
      },
    },
  },
  email: nodemailerAdapter({
    defaultFromAddress: 'noreply@wuji.world',
    defaultFromName: 'ВуЧи',
    // Nodemailer transportOptions
    skipVerify: true,
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        servername: 'mail.veiag.dev', //Force servername for TLS handshake. Because we are using SMTP host via docker container name, which does not match the SSL certificate domain.
      },
    },
  }),
  i18n: {
    translations: customTranslations,
    supportedLanguages: {
      en,
      uk,
    },
    fallbackLanguage: 'uk',
  },
  collections,
  globals,
  onInit: async (payload) => {
    // Одноразовий сід сторінки "Про ВуЧи" (колишній хардкод /about)
    await seedAboutPage(payload)
    // Одноразовий сід футера (колишній хардкод-компонент)
    await seedFooter(payload)
  },
  graphQL: {
    disable: true, //Disable GraphQL API, not needed for this project
  },
  upload: {
    // Жорстка стеля для будь-якого завантаження: запит, що перевищує її,
    // обривається на рівні парсера, не доходячи ні до sharp, ні до диска.
    // Дрібніші ліміти (по колекціях і ролях) — у хуках колекцій.
    limits: {
      fileSize: mbToBytes(MAX_UPLOAD_FILE_SIZE_MB),
    },
    abortOnLimit: true,
    // Без трансформерів: у v4 вони будують головний файл як похідний і зберігають ще й
    // необроблений оригінал. Зменшення й WebP робить hooks/limitImageUpload до збереження.
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      // Внутрішні посилання — лише на публічні сторінки сайту (без users, media тощо).
      // Рендер будує URL за актуальним slug: src/components/RichText.tsx
      LinkFeature({
        enabledCollections: [...linkableCollections],
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Payload 4 знизив дефолт до 1; фронтенд і хуки розраховують на 2 рівні populate
  defaultDepth: 2,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
    afterOpenConnection: ensureChapterOrderIndex,
  }),
  plugins: [
    payloadEnhancedSidebar({
      // graphics.Icon — марка з власним темним тайлом, тож без тайла плагіна, на весь розмір
      logo: { container: 'none' },
      tabs: [
        {
          id: 'dashboard',
          type: 'link',
          href: '/',
          icon: 'House',
          label: { en: 'Dashboard', uk: 'Головна' },
        },
        {
          id: 'content',
          type: 'tab',
          icon: 'BookOpen',
          label: { en: 'Content', uk: 'Контент' },
          collections: ['books', 'bookChapters', 'bookRequests', 'authors', 'bookGenres'],
        },
        {
          id: 'media',
          type: 'link',
          href: '/collections/media',
          icon: 'Image',
          label: { en: 'Media', uk: 'Медіа' },
        },
        {
          id: 'blog',
          type: 'tab',
          icon: 'Newspaper',
          label: { en: 'Blog', uk: 'Блог' },
          collections: ['posts', 'files'],
          access: sidebarTabAccess(['admin']),
        },
        {
          id: 'moderation',
          type: 'tab',
          icon: 'ShieldAlert',
          label: { en: 'Moderation', uk: 'Модерація' },
          collections: ['complaints', 'reviews', 'chapterComments'],
          customItems: [
            {
              slug: 'complaints-review',
              href: '/complaints-review',
              label: { en: 'Resolve complaints', uk: 'Розбір скарг' },
              position: 'top',
            },
          ],
          access: sidebarTabAccess(['admin', 'editor']),
        },
        {
          id: 'users',
          type: 'tab',
          icon: 'Users',
          label: { en: 'Users', uk: 'Користувачі' },
          collections: [
            'users',
            'bookmarks',
            'readProgress',
            'notifications',
            'user-uploads',
          ],
          access: sidebarTabAccess(['admin']),
        },
        {
          id: 'pages',
          type: 'tab',
          icon: 'LayoutTemplate',
          label: { en: 'Pages', uk: 'Сторінки' },
          collections: ['pages'],
          globals: ['home-page', 'footer', 'banner'],
          access: sidebarTabAccess(['admin']),
        },
        {
          id: 'settings',
          type: 'link',
          href: '/globals/general-settings',
          icon: 'Settings',
          label: { en: 'Settings', uk: 'Налаштування' },
          position: 'bottom',
          access: sidebarTabAccess(['admin']),
        },
      ],
    }),
    seoPlugin({
      collections: ['posts', 'books', 'pages'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => doc.title || 'ВуЧи',
      generateDescription: ({ doc }) =>
        doc?.shortDescription || 'ВуЧи - це платформа для читання та обговорення книг',
      generateImage: ({ doc }) => {
        if (doc?.image) {
          return doc.image
        }
        return undefined
      },
    }),
    nestedDocsPlugin({
      collections: ['chapterComments'],
      generateLabel: (_docs, doc) => {
        return doc.id as string
      },
    }),
    algoliaSearchPlugin({
      configureIndexOnInit: false, //Only needed once
      credentials: {
        appId: process.env.ALGOLIA_APP_ID!,
        apiKey: process.env.ALGOLIA_API_KEY!,
        indexName: 'wuji_books',
      },
      reindexEndpoint: false,
      collections: [
        {
          slug: 'books',
          //origin — щоб у майбутньому можна було фільтрувати оригінали фасетом
          indexFields: ['title', 'alternativeNames', 'description', 'author', 'origin'],
        },
      ],
    }),
    clientConfigPlugin(),
    mcp({
      collectionSlugs: collections.map((c) => c.slug),
      globalSlugs: globals.map((g) => g.slug),
    }),
  ],
  storage: [
    s3Storage({
      // вимикається автоматично, якщо R2 не налаштований (напр. локальна розробка) —
      // тоді файли лежать на локальному volume, як і раніше
      enabled: Boolean(process.env.R2_BUCKET),
      collections: {
        media: {
          prefix: 'media',
          // публічний контент → віддаємо напряму з R2-домену, без проксі через Payload.
          // У v4 `prefix` тут уже містить папку `_objectKey` нового файлу (prefix/_objectKey)
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${process.env.R2_PUBLIC_URL}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
        files: {
          prefix: 'files',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${process.env.R2_PUBLIC_URL}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
        'user-uploads': {
          prefix: 'user-uploads',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${process.env.R2_PUBLIC_URL}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        // R2 приймає лише 'auto', звичайні AWS-регіони не працюють
        region: 'auto',
        // S3 API endpoint R2 — лише для завантаження файлів, не для роздачі
        endpoint: process.env.R2_ENDPOINT,
        // R2 використовує path-style адресацію бакета
        forcePathStyle: true,
      },
    }),
  ],
})
