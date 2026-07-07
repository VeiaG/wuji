import type { CollectionConfig } from 'payload'
import { admins } from './access/admins'

export const WikiIngestRuns: CollectionConfig = {
  slug: 'wikiIngestRuns',
  labels: {
    singular: { en: 'Wiki Ingest Run', uk: 'Прогін вікі-інжесту' },
    plural: { en: 'Wiki Ingest Runs', uk: 'Прогони вікі-інжесту' },
  },
  access: {
    read: admins,
    create: admins,
    update: admins,
    delete: admins,
  },
  admin: {
    useAsTitle: 'label',
    group: { en: 'Wiki', uk: 'Вікі' },
    defaultColumns: [
      'label',
      'novel',
      'status',
      'provider',
      'model',
      'processedChapters',
      'createdAt',
    ],
    description: {
      en: 'Bookkeeping for AI extraction runs: which chapter range was processed, with what model/prompt, and what it produced.',
      uk: 'Облік прогонів ШІ-екстракції: який діапазон розділів оброблено, якою моделлю/промптом і що згенеровано.',
    },
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      label: { en: 'Label', uk: 'Назва' },
    },
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'running',
      label: { en: 'Status', uk: 'Статус' },
      options: [
        { label: { en: 'Running', uk: 'Виконується' }, value: 'running' },
        { label: { en: 'Completed', uk: 'Завершено' }, value: 'completed' },
        { label: { en: 'Partial', uk: 'Частково' }, value: 'partial' },
        { label: { en: 'Failed', uk: 'Помилка' }, value: 'failed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'provider',
          type: 'select',
          defaultValue: 'ollama',
          label: { en: 'Provider', uk: 'Провайдер' },
          options: [
            { label: 'Ollama', value: 'ollama' },
            { label: 'vLLM', value: 'vllm' },
            { label: 'llama.cpp', value: 'llama-cpp' },
            { label: 'OpenAI-compatible', value: 'openai-compatible' },
            { label: { en: 'Manual', uk: 'Вручну' }, value: 'manual' },
          ],
        },
        {
          name: 'model',
          type: 'text',
          label: { en: 'Model', uk: 'Модель' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startedAt',
          type: 'date',
          defaultValue: () => new Date().toISOString(),
          label: { en: 'Started At', uk: 'Початок' },
        },
        {
          name: 'finishedAt',
          type: 'date',
          label: { en: 'Finished At', uk: 'Завершення' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'fromChapterIndex',
          type: 'number',
          min: 1,
          label: { en: 'From Chapter (#)', uk: 'Від розділу (№)' },
        },
        {
          name: 'toChapterIndex',
          type: 'number',
          min: 1,
          label: { en: 'To Chapter (#)', uk: 'До розділу (№)' },
        },
      ],
    },
    {
      name: 'failedChapterIndexes',
      type: 'number',
      hasMany: true,
      label: { en: 'Failed Chapters (#)', uk: 'Невдалі розділи (№)' },
      admin: {
        description: {
          en: 'Chapter numbers within the range that failed and should be retried.',
          uk: 'Номери розділів у діапазоні, які не вдалося обробити і які треба повторити.',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'processedChapters',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: { en: 'Processed Chapters', uk: 'Оброблено розділів' },
        },
        {
          name: 'createdEntries',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: { en: 'Created Entries', uk: 'Створено записів' },
        },
        {
          name: 'updatedEntries',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: { en: 'Updated Entries', uk: 'Оновлено записів' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'createdMentions',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: { en: 'Created Mentions', uk: 'Створено згадок' },
        },
        {
          name: 'createdRelations',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: { en: 'Created Relations', uk: 'Створено зв’язків' },
        },
      ],
    },
    {
      name: 'promptVersion',
      type: 'text',
      label: { en: 'Prompt Version', uk: 'Версія промпта' },
    },
    {
      name: 'settings',
      type: 'json',
      label: { en: 'Settings', uk: 'Налаштування' },
    },
    {
      name: 'error',
      type: 'textarea',
      label: { en: 'Error', uk: 'Помилка' },
    },
    {
      name: 'log',
      type: 'textarea',
      label: { en: 'Log', uk: 'Журнал' },
    },
  ],
}
