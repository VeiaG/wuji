import { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import type { GlobalAfterChangeHook } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { pageBlocks } from '../blocks'

const revalidateHomePage: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating home page')
    revalidatePath('/')
  }
  return doc
}

/**
 * Глобал для слотів блоків на головній сторінці.
 * Дозволяє з адмінки додавати блоки над та під основним контентом головної.
 */
const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: {
    en: 'Home Page',
    uk: 'Головна сторінка',
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
      name: 'beforeContent',
      label: {
        en: 'Blocks Before Content',
        uk: 'Блоки над контентом',
      },
      type: 'blocks',
      blocks: pageBlocks,
      admin: {
        description: {
          en: 'Blocks displayed above the main home page content.',
          uk: 'Блоки, які відображаються над основним контентом головної сторінки.',
        },
      },
    },
    {
      name: 'afterContent',
      label: {
        en: 'Blocks After Content',
        uk: 'Блоки під контентом',
      },
      type: 'blocks',
      blocks: pageBlocks,
      admin: {
        description: {
          en: 'Blocks displayed below the main home page content.',
          uk: 'Блоки, які відображаються під основним контентом головної сторінки.',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHomePage],
  },
}

export default HomePage
