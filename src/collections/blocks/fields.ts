import type { ArrayField, SelectField } from 'payload'

/**
 * Спільні поля для блоків сторінок: іконки, кольори іконок та масиви посилань.
 * Іконки рендеряться на фронтенді через мапу lucide-react (див. src/components/blocks/icons.tsx)
 */

export const iconOptions = [
  { label: 'Book Open', value: 'BookOpen' },
  { label: 'Heart', value: 'Heart' },
  { label: 'Github', value: 'Github' },
  { label: 'Code', value: 'Code' },
  { label: 'Users', value: 'Users' },
  { label: 'User Plus', value: 'UserPlus' },
  { label: 'Message Circle', value: 'MessageCircle' },
  { label: 'Credit Card', value: 'CreditCard' },
  { label: 'External Link', value: 'ExternalLink' },
  { label: 'Zap', value: 'Zap' },
  { label: 'Globe', value: 'Globe' },
  { label: 'Git Pull Request', value: 'GitPullRequest' },
  { label: 'Star', value: 'Star' },
  { label: 'Sparkles', value: 'Sparkles' },
  { label: 'Info', value: 'Info' },
  { label: 'Mail', value: 'Mail' },
  { label: 'Send', value: 'Send' },
  { label: 'Library', value: 'Library' },
  { label: 'Shield', value: 'Shield' },
  { label: 'Help Circle', value: 'HelpCircle' },
  { label: 'Rocket', value: 'Rocket' },
  { label: 'Pen Tool', value: 'PenTool' },
  { label: 'Arrow Right', value: 'ArrowRight' },
]

export const iconField = (overrides: Partial<SelectField> = {}): SelectField =>
  ({
    name: 'icon',
    type: 'select',
    label: {
      en: 'Icon',
      uk: 'Іконка',
    },
    options: iconOptions,
    ...overrides,
  }) as SelectField

export const iconColorField = (): SelectField => ({
  name: 'iconColor',
  type: 'select',
  label: {
    en: 'Icon Color',
    uk: 'Колір іконки',
  },
  defaultValue: 'primary',
  options: [
    { label: { en: 'Primary', uk: 'Основний' }, value: 'primary' },
    { label: { en: 'Red', uk: 'Червоний' }, value: 'red' },
    { label: { en: 'Blue', uk: 'Синій' }, value: 'blue' },
    { label: { en: 'Green', uk: 'Зелений' }, value: 'green' },
    { label: { en: 'Purple', uk: 'Фіолетовий' }, value: 'purple' },
    { label: { en: 'Orange', uk: 'Помаранчевий' }, value: 'orange' },
    { label: { en: 'Cyan', uk: 'Блакитний' }, value: 'cyan' },
    { label: { en: 'Yellow', uk: 'Жовтий' }, value: 'yellow' },
  ],
})

export const linksField = (overrides: Partial<ArrayField> = {}): ArrayField =>
  ({
    name: 'links',
    type: 'array',
    label: {
      en: 'Links',
      uk: 'Посилання',
    },
    labels: {
      singular: {
        en: 'Link',
        uk: 'Посилання',
      },
      plural: {
        en: 'Links',
        uk: 'Посилання',
      },
    },
    fields: [
      {
        name: 'label',
        type: 'text',
        required: true,
        label: {
          en: 'Label',
          uk: 'Текст',
        },
      },
      {
        name: 'url',
        type: 'text',
        required: true,
        label: {
          en: 'URL',
          uk: 'URL',
        },
        admin: {
          description: {
            en: 'Internal (/novels) or external (https://...) link.',
            uk: 'Внутрішнє (/novels) або зовнішнє (https://...) посилання.',
          },
        },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'variant',
            type: 'select',
            defaultValue: 'default',
            label: {
              en: 'Style',
              uk: 'Стиль',
            },
            options: [
              { label: { en: 'Primary', uk: 'Основна' }, value: 'default' },
              { label: { en: 'Outline', uk: 'Контурна' }, value: 'outline' },
              { label: { en: 'Secondary', uk: 'Другорядна' }, value: 'secondary' },
              { label: { en: 'Ghost', uk: 'Прозора' }, value: 'ghost' },
            ],
          },
          iconField(),
        ],
      },
      {
        name: 'newTab',
        type: 'checkbox',
        label: {
          en: 'Open in New Tab',
          uk: 'Відкрити в новій вкладці',
        },
      },
    ],
    ...overrides,
  }) as ArrayField
