import { enTranslations } from '@payloadcms/translations/languages/en'
import { ukTranslations } from '@payloadcms/translations/languages/uk'
import type { NestedKeysStripped } from '@payloadcms/translations'

export const customTranslations = {
  en: {
    books: {
      noAccessToBook: 'You do not have access to this book',
      writersOriginalOnly: 'Writers can only create original books',
      cannotChangeOrigin: 'You cannot change the book type',
    },
    media: {
      uploadLimitReached:
        'You have reached your media upload limit ({{limit}} files). Delete some of your files before uploading new ones.',
    },
    uploads: {
      fileRequired: 'A file is required.',
      invalidFileType: 'Unsupported file type. Allowed types: {{types}}.',
      fileTooLarge: 'The file is too large. Maximum size is {{limit}} MB.',
      tooManyUploads:
        'Too many uploads in a short time ({{limit}} per hour). Please try again later.',
      uploadLimitReached:
        'You have reached your upload limit ({{limit}} files). Delete some of your files before uploading new ones.',
      notFileOwner: 'You can only use files you uploaded yourself.',
      accountTooNew:
        'Avatar and banner become available {{days}} days after registration. {{remaining}} day(s) left.',
    },
  },
  uk: {
    books: {
      noAccessToBook: 'У вас немає доступу до цієї книги',
      writersOriginalOnly: 'Письменники можуть створювати лише оригінали',
      cannotChangeOrigin: 'Ви не можете змінювати тип книги',
    },
    media: {
      uploadLimitReached:
        'Ви досягли ліміту завантажень медіа ({{limit}} файлів). Видаліть частину своїх файлів, щоб завантажити нові.',
    },
    uploads: {
      fileRequired: 'Потрібно додати файл.',
      invalidFileType: 'Непідтримуваний тип файлу. Дозволені типи: {{types}}.',
      fileTooLarge: 'Файл завеликий. Максимальний розмір — {{limit}} МБ.',
      tooManyUploads:
        'Забагато завантажень за короткий час ({{limit}} на годину). Спробуйте пізніше.',
      uploadLimitReached:
        'Ви досягли ліміту завантажень ({{limit}} файлів). Видаліть частину своїх файлів, щоб завантажити нові.',
      notFileOwner: 'Можна використовувати лише власні завантажені файли.',
      accountTooNew:
        'Аватар і банер стають доступні через {{days}} днів після реєстрації. Зачекайте ще {{remaining}} дн.',
    },
  },
}

export type CustomTranslationsObject = typeof customTranslations.en &
  typeof enTranslations &
  typeof ukTranslations
export type CustomTranslationsKeys = NestedKeysStripped<CustomTranslationsObject>
