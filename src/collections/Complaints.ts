import { CollectionConfig } from 'payload'
import { admins } from './access/admins'
import {
  adminsAndEditorsChapters,
  baseListFilterChapters,
  chapterAccessValidation,
} from './access/books'

const Complaints: CollectionConfig = {
  slug: 'complaints',
  labels: {
    singular: 'Скарга',
    plural: 'Скарги',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'complaintType', 'status', 'createdAt'],
    listSearchableFields: ['selectedText', 'description', 'userEmail'],
    baseListFilter: baseListFilterChapters,
  },
  access: {
    // Тільки адміністратори можуть переглядати скарги
    read: admins,
    create: () => true, // API може створювати скарги
    update: adminsAndEditorsChapters,
    delete: admins,
  },
  fields: [
    {
      name: 'selectedText',
      type: 'textarea',
      label: 'Виділений текст',
      required: true,
      maxLength: 1000,
    },
    {
      name: 'complaintType',
      type: 'select',
      label: 'Тип скарги',
      required: true,
      options: [
        {
          label: 'Неточний переклад',
          value: 'incorrect-translation',
        },
        {
          label: 'Граматична помилка',
          value: 'grammatical-error',
        },
        {
          label: 'Невідповідність термінології',
          value: 'terminology-inconsistency',
        },
        {
          label: 'Стилістична проблема',
          value: 'stylistic-issue',
        },
        {
          label: 'Пропущений текст',
          value: 'missing-text',
        },
        {
          label: 'Інше',
          value: 'other',
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Опис проблеми',
      required: true,
      maxLength: 2000,
    },
    {
      name: 'pageNumber',
      type: 'number',
      label: 'Номер сторінки',
      required: true,
    },
    {
      name: 'chapter',
      type: 'relationship',
      relationTo: 'bookChapters',
      label: 'Розділ книги',
      required: true,
      admin: {
        readOnly: true,
        allowCreate: false,
      },
    },
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      label: 'Книга',
      required: true,
      validate: chapterAccessValidation, //aditional validation to check if user has access to the book. Used in API validation
      admin: {
        position: 'sidebar',
        allowCreate: false, // prevent creating new books from chapter creation
        allowEdit: false, // prevent editing book from chapter creation
        readOnly: true,
      },
    },
    {
      name: 'position',
      type: 'group',
      label: 'Позиція в тексті',
      fields: [
        {
          name: 'start',
          type: 'number',
          label: 'Початок',
        },
        {
          name: 'end',
          type: 'number',
          label: 'Кінець',
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: 'Очікує розгляду',
          value: 'pending',
        },
        {
          label: 'На розгляді',
          value: 'reviewing',
        },
        {
          label: 'Виправлено',
          value: 'resolved',
        },
        {
          label: 'Відхилено',
          value: 'rejected',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}

export default Complaints
