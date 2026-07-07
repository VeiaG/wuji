import type { CollectionConfig } from 'payload'
import { admins } from './access/admins'

export const WikiMentions: CollectionConfig = {
  slug: 'wikiMentions',
  labels: {
    singular: { en: 'Wiki Mention', uk: 'Вікі-згадка' },
    plural: { en: 'Wiki Mentions', uk: 'Вікі-згадки' },
  },
  access: {
    // Evidence data (quotes, deaths, power-ups) leaks spoilers and unreviewed
    // entries, so it is admin-only. Server components read it through the
    // local API (overrideAccess) and apply spoiler filtering themselves.
    read: admins,
    create: admins,
    update: admins,
    delete: admins,
  },
  admin: {
    useAsTitle: 'rawName',
    group: { en: 'Wiki', uk: 'Вікі' },
    defaultColumns: ['rawName', 'entry', 'chapterIndex', 'mentionType', 'confidence', 'approved'],
    listSearchableFields: ['rawName', 'quote', 'context'],
    description: {
      en: 'Evidence layer: one record per entity per chapter. The unique index (entry + chapterIndex + rawName) makes ingest re-runs idempotent — the pipeline should upsert.',
      uk: 'Шар доказів: один запис на сутність на розділ. Унікальний індекс (entry + chapterIndex + rawName) робить повторні прогони ідемпотентними — пайплайн має робити upsert.',
    },
  },
  defaultSort: '-createdAt',
  indexes: [
    {
      fields: ['entry', 'chapterIndex', 'rawName'],
      unique: true,
    },
    {
      fields: ['novel', 'chapterIndex'],
    },
  ],
  fields: [
    {
      name: 'novel',
      type: 'relationship',
      relationTo: 'books',
      required: true,
      index: true,
      label: { en: 'Novel', uk: 'Книга' },
      admin: {
        position: 'sidebar',
        allowCreate: false,
        allowEdit: false,
      },
    },
    {
      name: 'entry',
      type: 'relationship',
      relationTo: 'wikiEntries',
      required: true,
      index: true,
      label: { en: 'Entry', uk: 'Запис' },
      admin: {
        position: 'sidebar',
        allowCreate: false,
        allowEdit: false,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'chapter',
          type: 'relationship',
          relationTo: 'bookChapters',
          label: { en: 'Chapter', uk: 'Розділ' },
          admin: {
            allowCreate: false,
            allowEdit: false,
          },
        },
        {
          name: 'chapterIndex',
          type: 'number',
          required: true,
          min: 1,
          index: true,
          label: { en: 'Chapter #', uk: '№ розділу' },
          admin: {
            description: {
              en: '1-based chapter number, same numbering as reader URLs and readProgress. Used for spoiler gating and ordering.',
              uk: 'Номер розділу від 1 — та сама нумерація, що в URL читалки та readProgress. Використовується для спойлер-фільтрації та сортування.',
            },
          },
        },
      ],
    },
    {
      name: 'rawName',
      type: 'text',
      required: true,
      index: true,
      label: { en: 'Raw Mention', uk: 'Згадка в тексті' },
      admin: {
        description: {
          en: 'The exact name or phrase used in the chapter text.',
          uk: 'Точне ім’я або фраза, вжиті в тексті розділу.',
        },
      },
    },
    {
      name: 'mentionType',
      type: 'select',
      required: true,
      defaultValue: 'appearance',
      label: { en: 'Mention Type', uk: 'Тип згадки' },
      options: [
        { label: { en: 'Appearance', uk: 'Поява' }, value: 'appearance' },
        { label: { en: 'Dialogue', uk: 'Діалог' }, value: 'dialogue' },
        { label: { en: 'Backstory', uk: 'Передісторія' }, value: 'backstory' },
        { label: { en: 'Power-up', uk: 'Посилення' }, value: 'power-up' },
        {
          label: { en: 'Relationship Change', uk: 'Зміна стосунків' },
          value: 'relationship-change',
        },
        { label: { en: 'Death', uk: 'Смерть' }, value: 'death' },
        { label: { en: 'Item Acquired', uk: 'Отримано предмет' }, value: 'item-acquired' },
        { label: { en: 'Location Visited', uk: 'Відвідано локацію' }, value: 'location-visited' },
        { label: { en: 'Realm Change', uk: 'Зміна царства' }, value: 'realm-change' },
        { label: { en: 'Other', uk: 'Інше' }, value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      label: { en: 'Quote', uk: 'Цитата' },
      admin: {
        description: {
          en: 'Short source quote from the chapter.',
          uk: 'Коротка цитата-джерело з розділу.',
        },
      },
    },
    {
      name: 'context',
      type: 'textarea',
      label: { en: 'Context', uk: 'Контекст' },
      admin: {
        description: {
          en: 'What this mention tells us about the entry.',
          uk: 'Що ця згадка говорить нам про запис.',
        },
      },
    },
    {
      name: 'confidence',
      type: 'number',
      min: 0,
      max: 1,
      label: { en: 'Confidence', uk: 'Впевненість' },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      label: { en: 'Human Approved', uk: 'Схвалено людиною' },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'ai',
      label: { en: 'Source', uk: 'Джерело' },
      options: [
        { label: { en: 'AI', uk: 'ШІ' }, value: 'ai' },
        { label: { en: 'Manual', uk: 'Вручну' }, value: 'manual' },
        { label: { en: 'Import', uk: 'Імпорт' }, value: 'import' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      label: { en: 'Metadata', uk: 'Метадані' },
    },
  ],
}
