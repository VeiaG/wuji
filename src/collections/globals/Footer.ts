import { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import type { GlobalAfterChangeHook } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { iconField } from '../blocks/fields'
import { FOOTER_CACHE_TAG } from '@/lib/footer'

const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating footer')
    revalidateTag(FOOTER_CACHE_TAG, 'max')
  }
  return doc
}

const Footer: GlobalConfig = {
  slug: 'footer',
  label: {
    en: 'Footer',
    uk: 'Футер',
  },
  admin: {
    group: {
      en: 'Pages',
      uk: 'Сторінки',
    },
  },
  access: {
    read: anyone,
    update: admins,
  },
  fields: [
    {
      name: 'description',
      type: 'textarea',
      label: {
        en: 'Description',
        uk: 'Опис',
      },
      admin: {
        description: {
          en: 'Short text under the site name in the footer.',
          uk: 'Короткий текст під назвою сайту у футері.',
        },
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: {
        en: 'Social Links',
        uk: 'Соціальні мережі',
      },
      labels: {
        singular: {
          en: 'Social Link',
          uk: 'Соціальне посилання',
        },
        plural: {
          en: 'Social Links',
          uk: 'Соціальні посилання',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            iconField({ required: true }),
            {
              name: 'label',
              type: 'text',
              required: true,
              label: {
                en: 'Label (for screen readers)',
                uk: 'Назва (для скрінрідерів)',
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
            },
          ],
        },
      ],
    },
    {
      name: 'columns',
      type: 'array',
      label: {
        en: 'Link Columns',
        uk: 'Колонки посилань',
      },
      labels: {
        singular: {
          en: 'Column',
          uk: 'Колонка',
        },
        plural: {
          en: 'Columns',
          uk: 'Колонки',
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: {
            en: 'Column Title',
            uk: 'Заголовок колонки',
          },
        },
        {
          name: 'links',
          type: 'array',
          required: true,
          minRows: 1,
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
              type: 'row',
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
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      label: {
        en: 'Copyright Text',
        uk: 'Текст копірайту',
      },
      admin: {
        description: {
          en: 'Shown after "© {year}". Defaults to "ВуЧи. Всі права захищені."',
          uk: 'Показується після "© {рік}". За замовчуванням — "ВуЧи. Всі права захищені."',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}

export default Footer
