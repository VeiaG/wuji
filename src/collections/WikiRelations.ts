import type { CollectionConfig } from 'payload'
import { admins } from './access/admins'

export const WikiRelations: CollectionConfig = {
  slug: 'wikiRelations',
  labels: {
    singular: { en: 'Wiki Relation', uk: 'Вікі-зв’язок' },
    plural: { en: 'Wiki Relations', uk: 'Вікі-зв’язки' },
  },
  access: {
    // Graph edges reveal spoilers (enemies, deaths) and hidden entries, so
    // reads are admin-only. Server components read through the local API
    // (overrideAccess) and apply spoiler filtering themselves.
    read: admins,
    create: admins,
    update: admins,
    delete: admins,
  },
  admin: {
    useAsTitle: 'type',
    group: { en: 'Wiki', uk: 'Вікі' },
    defaultColumns: ['sourceEntry', 'type', 'targetEntry', 'chapterIndex', 'confidence'],
    description: {
      en: 'One edge per fact. Every type has a single canonical direction — the inverse view comes from the incomingRelations join on the entry. For symmetric types (friend-of, sibling-of...) the pipeline must normalize direction (e.g. lower entry id as source) so A→B and B→A do not both get created.',
      uk: 'Один зв’язок на факт. Кожен тип має єдиний канонічний напрямок — обернений вигляд дає join incomingRelations на записі. Для симетричних типів (friend-of, sibling-of...) пайплайн має нормалізувати напрямок (напр., менший id як source), щоб не створювались і A→B, і B→A.',
    },
  },
  defaultSort: '-updatedAt',
  indexes: [
    {
      fields: ['novel', 'sourceEntry', 'targetEntry', 'type'],
      unique: true,
    },
    {
      fields: ['novel', 'type'],
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
      name: 'sourceEntry',
      type: 'relationship',
      relationTo: 'wikiEntries',
      required: true,
      index: true,
      label: { en: 'Source Entry', uk: 'Запис-джерело' },
      admin: {
        allowCreate: false,
        allowEdit: false,
      },
    },
    {
      name: 'targetEntry',
      type: 'relationship',
      relationTo: 'wikiEntries',
      required: true,
      index: true,
      label: { en: 'Target Entry', uk: 'Запис-ціль' },
      admin: {
        allowCreate: false,
        allowEdit: false,
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'related-to',
      index: true,
      label: { en: 'Relation Type', uk: 'Тип зв’язку' },
      admin: {
        description: {
          en: 'Canonical directions: teacher-of (not student-of), parent-of (not child-of). Symmetric: related-to, sibling-of, friend-of, enemy-of, ally-of, rival-of, romantic-interest-of.',
          uk: 'Канонічні напрямки: teacher-of (без student-of), parent-of (без child-of). Симетричні: related-to, sibling-of, friend-of, enemy-of, ally-of, rival-of, romantic-interest-of.',
        },
      },
      options: [
        { label: { en: 'Related To', uk: 'Пов’язаний з' }, value: 'related-to' },
        { label: { en: 'Teacher Of', uk: 'Учитель' }, value: 'teacher-of' },
        { label: { en: 'Parent Of', uk: 'Батько/мати' }, value: 'parent-of' },
        { label: { en: 'Sibling Of', uk: 'Брат/сестра' }, value: 'sibling-of' },
        { label: { en: 'Friend Of', uk: 'Друг' }, value: 'friend-of' },
        { label: { en: 'Enemy Of', uk: 'Ворог' }, value: 'enemy-of' },
        { label: { en: 'Ally Of', uk: 'Союзник' }, value: 'ally-of' },
        { label: { en: 'Rival Of', uk: 'Суперник' }, value: 'rival-of' },
        {
          label: { en: 'Romantic Interest Of', uk: 'Романтичний інтерес' },
          value: 'romantic-interest-of',
        },
        { label: { en: 'Member Of', uk: 'Член' }, value: 'member-of' },
        { label: { en: 'Leader Of', uk: 'Лідер' }, value: 'leader-of' },
        { label: { en: 'Owner Of', uk: 'Власник' }, value: 'owner-of' },
        { label: { en: 'User Of', uk: 'Використовує' }, value: 'user-of' },
        { label: { en: 'Located In', uk: 'Розташований у' }, value: 'located-in' },
        { label: { en: 'Participant In', uk: 'Учасник' }, value: 'participant-in' },
      ],
    },
    {
      name: 'state',
      type: 'select',
      defaultValue: 'unknown',
      label: { en: 'State', uk: 'Стан' },
      options: [
        { label: { en: 'Unknown', uk: 'Невідомо' }, value: 'unknown' },
        { label: { en: 'Active', uk: 'Активний' }, value: 'active' },
        { label: { en: 'Ended', uk: 'Завершений' }, value: 'ended' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'chapterIndex',
      type: 'number',
      min: 1,
      index: true,
      label: { en: 'Evidence Chapter (#)', uk: 'Розділ-доказ (№)' },
      admin: {
        position: 'sidebar',
        description: {
          en: '1-based chapter number where this relation is established. Used for spoiler gating: hide the edge until the reader reaches this chapter.',
          uk: 'Номер розділу (від 1), де цей зв’язок встановлено. Для спойлер-фільтрації: ховати зв’язок, доки читач не дійде до цього розділу.',
        },
      },
    },
    {
      name: 'note',
      type: 'textarea',
      label: { en: 'Note', uk: 'Нотатка' },
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
      name: 'metadata',
      type: 'json',
      label: { en: 'Metadata', uk: 'Метадані' },
    },
  ],
}
