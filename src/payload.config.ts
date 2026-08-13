import { s3Storage } from '@payloadcms/storage-s3'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
// import { payloadCloudPlugin } from '@payloadcms/payload-cloud'

import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { BookGenres } from './collections/BookGenres'
import { Books } from './collections/Book'
import { Authors } from './collections/Authors'
import { BookChapters } from './collections/BookChapters'
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
import { payloadCmdk } from '@veiag/payload-cmdk'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    theme: 'dark',
    components: {
      afterLogin: ['@/components/admin/GoogleLoginButton#GoogleLoginButton'],
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
  collections: [
    Users,
    Media,
    BookGenres,
    Books,
    Authors,
    BookChapters,
    Post,
    ReadProgress,
    ChapterComment,
    Bookmarks,
    Complaints,
    Reviews,
    UserUploads,
    Notifications,
    Pages,
  ],
  globals: [Banner, HomePage, Footer, GeneralSettings],
  onInit: async (payload) => {
    // Одноразовий сід сторінки "Про ВуЧи" (колишній хардкод /about)
    await seedAboutPage(payload)
    // Одноразовий сід футера (колишній хардкод-компонент)
    await seedFooter(payload)
  },
  graphQL: {
    disable: true, //Disable GraphQL API, not needed for this project
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    s3Storage({
      // вимикається автоматично, якщо R2 не налаштований (напр. локальна розробка) —
      // тоді файли лежать на локальному volume, як і раніше
      enabled: Boolean(process.env.R2_BUCKET),
      collections: {
        media: {
          prefix: 'media',
          // публічний контент → віддаємо напряму з R2-домену, без проксі через Payload
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
    payloadEnhancedSidebar({
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
          collections: ['books', 'bookChapters', 'authors', 'bookGenres'],
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
          type: 'link',
          href: '/collections/posts',
          icon: 'Newspaper',
          label: { en: 'Blog', uk: 'Блог' },
          access: sidebarTabAccess(['admin']),
        },
        {
          id: 'moderation',
          type: 'tab',
          icon: 'ShieldAlert',
          label: { en: 'Moderation', uk: 'Модерація' },
          collections: ['complaints', 'reviews', 'chapterComments'],
          access: sidebarTabAccess(['admin', 'editor']),
        },
        {
          id: 'users',
          type: 'tab',
          icon: 'Users',
          label: { en: 'Users', uk: 'Користувачі' },
          collections: ['users', 'bookmarks', 'readProgress', 'notifications', 'user-uploads'],
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
    payloadCmdk({
      icons: {
        collections: {
          books: 'BookOpen',
          bookChapters: 'FileText',
          authors: 'BookA',
          bookGenres: 'Tags',
          bookmarks: 'Bookmark',
          users: 'Users',
          readProgress: 'Activity',
          posts: 'FileText',
          pages: 'LayoutTemplate',
        },
        globals: {
          banner: 'LayoutPanelTop',
          'home-page': 'House',
          footer: 'PanelBottom',
          'general-settings': 'Settings',
        },
      },
      customItems: [
        {
          type: 'item',
          slug: 'home',
          action: {
            type: 'link',
            href: '/',
          },
          label: {
            en: 'Home',
            uk: 'Головна',
          },
          access: ({ req }) => req.user?.roles?.includes('admin') || false,
        },
      ],
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
  ],
})
