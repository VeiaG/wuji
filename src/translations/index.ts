import { enTranslations } from '@payloadcms/translations/languages/en'
import { ukTranslations } from '@payloadcms/translations/languages/uk'
import type { NestedKeysStripped } from '@payloadcms/translations'

export const customTranslations = {
  en: {
    books: {
      noAccessToBook: 'You do not have access to this book',
    },
  },
  uk: {
    books: {
      noAccessToBook: 'У вас немає доступу до цієї книги',
    },
  },
}

export type CustomTranslationsObject = typeof customTranslations.en &
  typeof enTranslations &
  typeof ukTranslations
export type CustomTranslationsKeys = NestedKeysStripped<CustomTranslationsObject>
