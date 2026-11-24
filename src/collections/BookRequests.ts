import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'
import { adminsFieldAccess } from './access/admins'
import {
  adminsAndEditors,
  ownBookRequestsWhere,
  readBookRequests,
  updateBookRequests,
} from './access/bookRequests'
import { admins } from './access/admins'
import { checkRole } from './access/checkRole'
import { hiddenUnlessRole } from './access/hidden'
import { attachBookRequestEndpoint } from './endpoints/attachBookRequest'

//не лишаємо розділів-сиріт: заявку з розділами видалити не можна
const preventDeleteWithChapters: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({
    collection: 'bookChapters',
    where: { bookRequest: { equals: id } },
    overrideAccess: true,
    req,
  })
  if (totalDocs > 0) {
    throw new APIError(
      `У заявці ${totalDocs} розділ(ів). Перенесіть їх у книгу або видаліть перед видаленням заявки.`,
      400,
      undefined,
      true,
    )
  }
}

/**
 * Заявка на книгу: редактор заводить базові дані й одразу заливає розділи
 * (розділ належить або книзі, або заявці). Адмін створює справжню книгу і переносить
 * у неї розділи кнопкою в сайдбарі (POST /api/bookRequests/:id/attach).
 */
export const BookRequests: CollectionConfig = {
  slug: 'bookRequests',
  labels: {
    singular: { en: 'Book request', uk: 'Заявка на книгу' },
    plural: { en: 'Book requests', uk: 'Заявки на книги' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'requestStatus', 'createdBy', 'createdAt'],
    hidden: hiddenUnlessRole(['admin', 'editor']),
    baseListFilter: ({ req }) =>
      req.user && !checkRole(['admin'], req.user) ? ownBookRequestsWhere(req.user) : null,
    group: { en: 'Content', uk: 'Контент' },
  },
  access: {
    read: readBookRequests,
    create: adminsAndEditors,
    update: updateBookRequests,
    delete: admins,
  },
  endpoints: [attachBookRequestEndpoint],
  hooks: {
    beforeDelete: [preventDeleteWithChapters],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: { en: 'Title', uk: 'Назва' },
    },
    {
      name: 'alternativeNames',
      type: 'text',
      hasMany: true,
      label: { en: 'Alternative names', uk: 'Альтернативні назви' },
    },
    {
      name: 'description',
      type: 'richText',
      label: { en: 'Description', uk: 'Опис' },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: { en: 'Notes for admin', uk: 'Нотатки для адміна' },
      admin: {
        description: {
          en: 'Source, links, anything that helps to create the book.',
          uk: 'Джерело, посилання — усе, що допоможе створити книгу.',
        },
      },
    },
    {
      name: 'chapters',
      type: 'join',
      collection: 'bookChapters',
      on: 'bookRequest',
      //той самий ключ порядку, що й у книзі — після перенесення порядок не зміниться
      defaultSort: '_bookChapters_chapters_order',
      admin: {
        defaultColumns: ['title', 'addedAt'],
      },
      label: { en: 'Chapters', uk: 'Розділи' },
    },
    {
      //лише для вибору цільової книги в UI перенесення — у базу не пишеться
      name: 'targetBook',
      type: 'relationship',
      relationTo: 'books',
      virtual: true,
      access: {
        read: adminsFieldAccess,
        create: adminsFieldAccess,
        update: adminsFieldAccess,
      },
      admin: {
        position: 'sidebar',
        //у v4 віртуальні поля за замовчуванням read-only (sanitize.ts) — вмикаємо вибір
        readOnly: false,
        allowCreate: false,
        allowEdit: false,
        condition: (data) => Boolean(data?.id) && data?.requestStatus !== 'attached',
        description: {
          en: 'Create the book first, then pick it here and move the chapters.',
          uk: 'Спершу створіть книгу, потім оберіть її тут і перенесіть розділи.',
        },
      },
      label: { en: 'Move chapters to book', uk: 'Перенести розділи в книгу' },
    },
    {
      name: 'attachToBook',
      type: 'ui',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.id) && data?.requestStatus !== 'attached',
        components: {
          Field: '@/components/admin/BookRequestAttach/AttachToBook.client#AttachToBook',
        },
      },
    },
    {
      name: 'requestStatus',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: { en: 'New', uk: 'Нова' }, value: 'new' },
        { label: { en: 'Attached to book', uk: 'Перенесена в книгу' }, value: 'attached' },
      ],
      access: {
        create: adminsFieldAccess,
        update: adminsFieldAccess,
      },
      admin: { position: 'sidebar' },
      label: { en: 'Request status', uk: 'Статус заявки' },
    },
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      access: {
        create: adminsFieldAccess,
        update: adminsFieldAccess,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.book),
      },
      label: { en: 'Book', uk: 'Книга' },
    },
    {
      name: 'bookStatus',
      type: 'select',
      options: [
        { label: { en: 'Ongoing', uk: 'Онгоінг' }, value: 'ongoing' },
        { label: { en: 'Completed', uk: 'Завершено' }, value: 'completed' },
        { label: { en: 'Hiatus', uk: 'Пауза' }, value: 'hiatus' },
        { label: { en: 'Cancelled', uk: 'Скасовано' }, value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
      label: { en: 'Book status', uk: 'Статус книги' },
    },
    {
      name: 'genres',
      type: 'relationship',
      relationTo: 'bookGenres',
      hasMany: true,
      admin: { position: 'sidebar', allowCreate: false },
      label: { en: 'Genres', uk: 'Жанри' },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      admin: {
        position: 'sidebar',
        allowCreate: false,
        allowEdit: false,
        description: {
          en: 'If the author already exists. Otherwise write the name below.',
          uk: 'Якщо автор уже є в базі. Інакше впишіть ім’я нижче.',
        },
      },
      label: { en: 'Author', uk: 'Автор' },
    },
    {
      name: 'authorName',
      type: 'text',
      admin: { position: 'sidebar' },
      label: { en: 'Author name (for admin)', uk: 'Автор (для адміна)' },
    },
  ],
  versions: false,
  authorship: true,
}
