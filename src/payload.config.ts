// storage-adapter-import-placeholder
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  email: nodemailerAdapter({
    defaultFromAddress: 'wuji@veiag.dev',
    defaultFromName: 'ВуЧи',
    // Nodemailer transportOptions
    skipVerify: true,
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
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
  ],
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
    seoPlugin({
      collections: ['posts'],
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
  ],
})
