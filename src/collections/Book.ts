import { slugField } from '@/fields/slug'
import type { CollectionBeforeValidateHook, CollectionConfig, FieldHook } from 'payload'
import { ValidationError } from 'payload'
import { anyone } from './access/anyone'
import { admins, adminsFieldAccess } from './access/admins'
import adminsAndEditorsBook, {
  adminsAndWriters,
  adminsAndWritersDeleteBook,
  adminsOrBookOwnerFieldAccess,
  baseListFilterBooks,
} from './access/books'
import { checkRole } from './access/checkRole'
import { revalidateBook, revalidateDeleteBook } from './hooks/revalidateBookList'
import type { Book, User } from '@/payload-types'
import type { TFunction } from '@payloadcms/translations'
import type { CustomTranslationsKeys } from '@/translations'

//owner is forced server-side for non-admins — writers cannot pick the owner themselves
//(spoofed values are stripped earlier by field-level access control)
const forceWriterOwnership: CollectionBeforeValidateHook<Book> = ({ data = {}, operation, req }) => {
  if (operation === 'create' && req.user && !checkRole(['admin'], req.user)) {
    data.owner = req.user.id
  }
  return data
}

//origin is editable, but non-admins are constrained: create only as 'original',
//and the value cannot change on update (missing origin on old books counts as 'translation')
const validateOriginChange: FieldHook<Book> = ({ value, previousValue, operation, req }) => {
  if (!req.user || checkRole(['admin'], req.user)) {
    return value
  }
  const t = req.t as TFunction<CustomTranslationsKeys>
  if (operation === 'create') {
    if (value !== 'original') {
      throw new ValidationError({
        errors: [{ message: t('books:writersOriginalOnly'), path: 'origin' }],
      })
    }
  } else {
    const prev = previousValue ?? 'translation'
    if (value !== prev) {
      throw new ValidationError({
        errors: [{ message: t('books:cannotChangeOrigin'), path: 'origin' }],
      })
    }
  }
  return value
}

export const Books: CollectionConfig = {
  slug: 'books',
  labels: {
    singular: {
      en: 'Book',
      uk: 'Книга',
    },
    plural: {
      en: 'Books',
      uk: 'Книги',
    },
  },
  admin: {
    useAsTitle: 'title',
    baseListFilter: baseListFilterBooks, // Filter books based on user access
    group: {
      en: 'Content',
      uk: 'Контент',
    },
  },
  orderable: true,
  defaultSort: '_order',
  access: {
    read: anyone,
    create: adminsAndWriters, //admins can create any book, writers — their own originals
    update: adminsAndEditorsBook, //admins, editors (bookAccess) and writers (own books) can update
    delete: adminsAndWritersDeleteBook, //admins can delete any book, writers — their own
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: {
        en: 'Title',
        uk: 'Назва',
      },
    },
    {
      name: 'alternativeNames',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: { en: 'Ongoing', uk: 'Онгоінг' }, value: 'ongoing' },
        { label: { en: 'Completed', uk: 'Завершено' }, value: 'completed' },
        { label: { en: 'Hiatus', uk: 'Пауза' }, value: 'hiatus' },
        { label: { en: 'Cancelled', uk: 'Скасовано' }, value: 'cancelled' },
      ],
      required: true,
      defaultValue: 'completed', //Щоб не міняти для існуючих
    },
    {
      name: 'origin',
      type: 'select',
      options: [
        { label: { en: 'Translation', uk: 'Переклад' }, value: 'translation' },
        { label: { en: 'Original', uk: 'Оригінал' }, value: 'original' },
      ],
      required: true,
      //Дефолт 'translation' (в т.ч. без user — скрипти/сіди та старі книги), 'original' — лише
      //для "чистих" письменників, щоб форма створення одразу ховала поле author.
      //Це виключно зручність UI: правила застосовує validateOriginChange
      defaultValue: ({ user }) =>
        user &&
        checkRole(['writer'], user as User) &&
        !checkRole(['admin', 'editor'], user as User)
          ? 'original'
          : 'translation',
      index: true,
      admin: {
        position: 'sidebar',
        description: {
          en: 'Originals are user-written books, kept separate from the main catalog.',
          uk: 'Оригінали — авторські твори користувачів, показуються окремо від основного каталогу.',
        },
      },
      hooks: {
        beforeChange: [validateOriginChange],
      },
      label: {
        en: 'Origin',
        uk: 'Тип',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      index: true,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.origin === 'original',
      },
      access: {
        //for writers the value is forced to the current user by the forceWriterOwnership hook
        update: adminsFieldAccess,
        create: adminsFieldAccess,
      },
      label: {
        en: 'Owner (writer)',
        uk: 'Власник (письменник)',
      },
    },
    {
      name: 'isAIAssisted',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.origin === 'original',
        description: {
          en: 'Check this if the text was written with AI assistance.',
          uk: 'Позначте, якщо текст написано з допомогою ШІ.',
        },
      },
      label: {
        en: 'Written with AI assistance',
        uk: 'Написано з допомогою ШІ',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        position: 'sidebar',
      },
      access: {
        //admins, or writers on their own books
        update: adminsOrBookOwnerFieldAccess,
        create: adminsOrBookOwnerFieldAccess,
      },
      label: {
        en: 'Cover Image',
        uk: 'Обкладинка',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      label: {
        en: 'Description',
        uk: 'Опис',
      },
    },
    {
      name: 'genres',
      type: 'relationship',
      relationTo: 'bookGenres',
      hasMany: true,
      required: true,
      access: {
        //admins, or writers on their own books
        update: adminsOrBookOwnerFieldAccess,
        create: adminsOrBookOwnerFieldAccess,
      },
      admin: {
        position: 'sidebar',
        allowCreate: false, // prevent creating new genres from book creation
      },
      label: {
        en: 'Genres',
        uk: 'Жанри',
      },
    },

    {
      name: 'chapters',
      type: 'join',
      collection: 'bookChapters',
      on: 'book',
      orderable: true,
      admin: {
        defaultColumns: ['title', 'addedAt'],
      },
      label: {
        en: 'Chapters',
        uk: 'Розділи',
      },
    },
    {
      name: 'volumes',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          index: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'from',
              type: 'number',
              required: true,
            },
            {
              name: 'to',
              type: 'number',
              required: true,
            },
          ],
        },
      ],
      label: {
        en: 'Volumes',
        uk: 'Томи',
      },
      admin: {
        description: {
          en: 'Volumes are used to group chapters. For example, a book can have multiple volumes, each containing a range of chapters.',
          uk: 'Томи використовуються для групування розділів. Наприклад, книга може мати кілька томів, кожен з яких містить діапазон розділів.',
        },
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: false,
      // required + condition: для оригіналів поле приховане і не валідується,
      // а в згенерованих типах стає опційним; для перекладів адмінка вимагає його заповнити
      required: true,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.origin !== 'original',
      },
      access: {
        //restrict updating to admins only
        update: adminsFieldAccess,
        create: adminsFieldAccess,
      },
      label: {
        en: 'Author',
        uk: 'Автор',
      },
    },

    ...slugField(),
    {
      name: 'chapterCount',
      type: 'number',
      label: {
        en: 'Chapter Count',
        uk: 'Кількість розділів',
      },
      admin: {
        position: 'sidebar',
        readOnly: true, // this field is calculated and should not be edited manually
      },
    },
    {
      name: 'averageRating',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'totalReviews',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeValidate: [forceWriterOwnership],
    afterChange: [revalidateBook],
    afterDelete: [revalidateDeleteBook],
  },
}
