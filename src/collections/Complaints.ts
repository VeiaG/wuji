import { CollectionConfig } from 'payload'
import { admins } from './access/admins'
import { adminsAndEditorsChapters, baseListFilterChapters } from './access/books'
import { hiddenUnlessRole } from './access/hidden'
import { notifyComplaintResolved } from './hooks/notifyComplaintResolved'

const Complaints: CollectionConfig = {
  slug: 'complaints',
  labels: {
    singular: 'Скарга',
    plural: 'Скарги',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'selectedText', 'status', 'createdAt'],
    listSearchableFields: ['selectedText', 'description'],
    baseListFilter: baseListFilterChapters,
    // видима адмінам та редакторам (по їхніх книгах), схована від письменників
    hidden: hiddenUnlessRole(['admin', 'editor']),
  },
  access: {
    // адміни бачать усі скарги; редактори/письменники — лише по своїх книгах
    // (фільтрація за книгою в adminsAndEditorsChapters, узгоджено з update)
    read: adminsAndEditorsChapters,
    create: () => true, // API може створювати скарги
    update: adminsAndEditorsChapters,
    delete: admins,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        // create відкритий для всіх: автора й статус ставить сервер, а не клієнт
        if (operation === 'create') {
          data.user = req.user?.collection === 'users' ? req.user.id : null
          data.status = 'pending'
        }
        return data
      },
    ],
    afterChange: [notifyComplaintResolved],
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
      name: 'description',
      type: 'textarea',
      label: 'Опис проблеми',
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
      admin: {
        position: 'sidebar',
        allowCreate: false, // prevent creating new books from chapter creation
        allowEdit: false, // prevent editing book from chapter creation
        readOnly: true,
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Автор скарги',
      admin: {
        position: 'sidebar',
        readOnly: true,
        allowCreate: false,
        allowEdit: false,
        description: 'Порожньо — скаргу залишив гість',
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
