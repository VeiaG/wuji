import { slugField } from '@/fields/slug'
import type { Access, CollectionConfig } from 'payload'
import { admins } from './access/admins'
import { checkRole } from './access/checkRole'

const publicWikiEntries: Access = ({ req: { user } }) => {
  if (checkRole(['admin'], user)) {
    return true
  }

  return {
    or: [{ status: { equals: 'auto' } }, { status: { equals: 'published' } }],
  }
}

export const WikiEntries: CollectionConfig = {
  slug: 'wikiEntries',
  labels: {
    singular: { en: 'Wiki Entry', uk: 'Вікі-запис' },
    plural: { en: 'Wiki Entries', uk: 'Вікі-записи' },
  },
  access: {
    read: publicWikiEntries,
    create: admins,
    update: admins,
    delete: admins,
  },
  admin: {
    useAsTitle: 'title',
    group: { en: 'Wiki', uk: 'Вікі' },
    defaultColumns: ['title', 'type', 'novel', 'status', 'confidence', 'updatedAt'],
    listSearchableFields: ['title', 'aliases', 'shortDescription'],
    description: {
      en: 'Entities extracted from chapters (characters, locations, items...). Spoiler gating is NOT enforced by access control — the frontend must filter by spoilerChapterIndex against reader progress.',
      uk: 'Сутності, видобуті з розділів (персонажі, локації, предмети...). Спойлери НЕ фільтруються на рівні доступу — фронтенд має порівнювати spoilerChapterIndex з прогресом читача.',
    },
  },
  defaultSort: 'title',
  versions: {
    maxPerDoc: 20,
  },
  indexes: [
    {
      fields: ['novel', 'slug'],
      unique: true,
    },
    {
      fields: ['novel', 'type'],
    },
    {
      fields: ['novel', 'spoilerChapterIndex'],
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
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'concept',
      index: true,
      label: { en: 'Type', uk: 'Тип' },
      options: [
        { label: { en: 'Character', uk: 'Персонаж' }, value: 'character' },
        { label: { en: 'Location', uk: 'Локація' }, value: 'location' },
        {
          label: { en: 'Organization / Sect / Clan', uk: 'Організація / Секта / Клан' },
          value: 'organization',
        },
        { label: { en: 'Technique / Ability', uk: 'Техніка / Здібність' }, value: 'technique' },
        { label: { en: 'Item / Artifact', uk: 'Предмет / Артефакт' }, value: 'item' },
        {
          label: { en: 'Realm / Cultivation Level', uk: 'Царство / Рівень культивації' },
          value: 'realm',
        },
        { label: { en: 'Event / Timeline', uk: 'Подія / Хронологія' }, value: 'event' },
        { label: { en: 'Concept', uk: 'Концепція' }, value: 'concept' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      label: { en: 'Title', uk: 'Назва' },
    },
    ...slugField('title', {
      slugOverrides: {
        required: true,
        admin: {
          position: 'sidebar',
        },
      },
    }),
    {
      name: 'aliases',
      type: 'text',
      hasMany: true,
      label: { en: 'Aliases', uk: 'Аліаси' },
      admin: {
        description: {
          en: 'Alternative names used in the text. The ingest pipeline matches new mentions against title + aliases before creating a new entry.',
          uk: 'Альтернативні імена з тексту. Пайплайн звіряє нові згадки з назвою та аліасами, перш ніж створювати новий запис.',
        },
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Image', uk: 'Зображення' },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      label: { en: 'Short Description', uk: 'Короткий опис' },
      admin: {
        description: {
          en: 'One-two sentences, spoiler-free if possible. Shown in lists, tooltips and link previews.',
          uk: 'Одне-два речення, бажано без спойлерів. Показується у списках, підказках і прев’ю посилань.',
        },
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: { en: 'Wiki Page Content', uk: 'Вміст вікі-сторінки' },
      admin: {
        description: {
          en: 'The pipeline generates Markdown and converts it via convertMarkdownToLexical (same as importChapters.ts).',
          uk: 'Пайплайн генерує Markdown і конвертує його через convertMarkdownToLexical (як в importChapters.ts).',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'firstAppearanceIndex',
          type: 'number',
          min: 1,
          label: { en: 'First Appearance (chapter #)', uk: 'Перша поява (№ розділу)' },
          admin: {
            description: {
              en: '1-based chapter number, same numbering as reader URLs and readProgress.',
              uk: 'Номер розділу від 1 — та сама нумерація, що в URL читалки та readProgress.',
            },
          },
        },
        {
          name: 'spoilerChapterIndex',
          type: 'number',
          min: 1,
          index: true,
          label: { en: 'Spoiler Level (chapter #)', uk: 'Рівень спойлера (№ розділу)' },
          admin: {
            description: {
              en: 'The entry is safe for readers who reached this chapter number. Frontend filters: spoilerChapterIndex <= readProgress.chapter.',
              uk: 'Запис безпечний для читачів, що дійшли до цього номера розділу. Фільтр на фронтенді: spoilerChapterIndex <= readProgress.chapter.',
            },
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'auto',
      index: true,
      label: { en: 'Status', uk: 'Статус' },
      options: [
        { label: { en: 'Auto Generated', uk: 'Згенеровано автоматично' }, value: 'auto' },
        { label: { en: 'Needs Review', uk: 'Потребує перегляду' }, value: 'review' },
        { label: { en: 'Published', uk: 'Опубліковано' }, value: 'published' },
        { label: { en: 'Hidden', uk: 'Приховано' }, value: 'hidden' },
      ],
      admin: {
        position: 'sidebar',
        description: {
          en: 'The ingest pipeline must only overwrite entries with status "auto". Human-touched entries (review/published/hidden) are never rewritten by AI.',
          uk: 'Пайплайн має перезаписувати лише записи зі статусом «auto». Записи, яких торкалась людина (review/published/hidden), ШІ не переписує.',
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
      name: 'generatedBy',
      type: 'text',
      label: { en: 'Generated By', uk: 'Згенеровано' },
      admin: {
        position: 'sidebar',
        description: {
          en: 'Model or script name that last generated this entry.',
          uk: 'Назва моделі або скрипта, що востаннє генерували цей запис.',
        },
      },
    },
    {
      name: 'lastProcessedChapterIndex',
      type: 'number',
      min: 1,
      label: { en: 'Last Processed Chapter (#)', uk: 'Останній оброблений розділ (№)' },
      admin: {
        position: 'sidebar',
        description: {
          en: 'Pipeline bookkeeping: the entry reflects chapters up to this number.',
          uk: 'Службове поле пайплайна: запис відображає розділи до цього номера включно.',
        },
      },
    },
    {
      name: 'metadata',
      type: 'json',
      label: { en: 'Metadata', uk: 'Метадані' },
      admin: {
        description: {
          en: 'Flexible type-specific scalar details. Put cross-entry links into Wiki Relations instead.',
          uk: 'Гнучкі скалярні деталі для конкретного типу. Зв’язки між записами зберігайте у Wiki Relations.',
        },
      },
    },
    {
      name: 'mentions',
      type: 'join',
      collection: 'wikiMentions',
      on: 'entry',
      label: { en: 'Mentions', uk: 'Згадки' },
      admin: {
        defaultColumns: ['chapterIndex', 'mentionType', 'confidence', 'createdAt'],
      },
    },
    {
      name: 'outgoingRelations',
      type: 'join',
      collection: 'wikiRelations',
      on: 'sourceEntry',
      label: { en: 'Outgoing Relations', uk: 'Вихідні зв’язки' },
      admin: {
        defaultColumns: ['type', 'targetEntry', 'confidence', 'chapterIndex'],
      },
    },
    {
      name: 'incomingRelations',
      type: 'join',
      collection: 'wikiRelations',
      on: 'targetEntry',
      label: { en: 'Incoming Relations', uk: 'Вхідні зв’язки' },
      admin: {
        defaultColumns: ['type', 'sourceEntry', 'confidence', 'chapterIndex'],
      },
    },
  ],
  hooks: {
    afterDelete: [
      // Cascade: remove evidence and graph edges of a deleted entry,
      // otherwise required relationships point at a missing document.
      async ({ id, req }) => {
        await req.payload.delete({
          collection: 'wikiMentions',
          where: { entry: { equals: id } },
          req,
        })
        await req.payload.delete({
          collection: 'wikiRelations',
          where: {
            or: [{ sourceEntry: { equals: id } }, { targetEntry: { equals: id } }],
          },
          req,
        })
      },
    ],
  },
}
