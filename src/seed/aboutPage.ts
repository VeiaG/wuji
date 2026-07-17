import type { Payload } from 'payload'
import type { CardGridBlock } from '@/payload-types'

type LexicalContent = NonNullable<CardGridBlock['cards'][number]['content']>
type LexicalChildren = LexicalContent['root']['children']

/**
 * Хелпери для побудови lexical-стану без редактора.
 * Мінімальний набір нод: текст, параграф, заголовок, список, посилання.
 */
const txt = (text: string, format = 0) => ({
  type: 'text',
  text,
  format,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
})

const p = (children: unknown[], align: '' | 'center' = '') => ({
  type: 'paragraph',
  children,
  direction: 'ltr',
  format: align,
  indent: 0,
  version: 1,
  textFormat: 0,
  textStyle: '',
})

const heading = (tag: 'h4' | 'h5', text: string) => ({
  type: 'heading',
  tag,
  children: [txt(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const ul = (items: string[]) => ({
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  children: items.map((item, index) => ({
    type: 'listitem',
    value: index + 1,
    children: [txt(item)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  })),
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const link = (text: string, url: string, newTab = false) => ({
  type: 'link',
  fields: {
    url,
    newTab,
    linkType: 'custom',
  },
  children: [txt(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 2,
})

const root = (children: unknown[]): LexicalContent => ({
  root: {
    type: 'root',
    children: children as LexicalChildren,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const BOLD = 1

/**
 * Сідить сторінку "Про ВуЧи" (slug: about) з контентом колишньої хардкод-сторінки.
 * Ідемпотентний: якщо сторінка з таким slug вже існує — нічого не робить.
 */
export const seedAboutPage = async (payload: Payload) => {
  const existing = await payload.count({
    collection: 'pages',
    where: {
      slug: {
        equals: 'about',
      },
    },
  })

  if (existing.totalDocs > 0) return

  payload.logger.info('Seeding "about" page...')

  await payload.create({
    collection: 'pages',
    context: {
      disableRevalidate: true,
    },
    data: {
      title: 'Про ВуЧи',
      slug: 'about',
      _status: 'published',
      meta: {
        title: 'Про ВуЧи',
        description: 'Відкрита платформа для читання ранобе українською мовою',
      },
      layout: [
        {
          blockType: 'hero',
          icon: 'BookOpen',
          heading: 'Про ВуЧи',
          subheading: 'Відкрита платформа для читання ранобе українською мовою',
          badges: [
            { icon: 'Zap', label: 'Альфа версія', variant: 'secondary' },
            { icon: 'Code', label: 'Open Source', variant: 'outline' },
          ],
        },
        {
          blockType: 'card-grid',
          columns: '1',
          cards: [
            {
              icon: 'Heart',
              iconColor: 'red',
              title: 'Чому ВуЧи?',
              content: root([
                p([
                  txt(
                    'Цей проект народився з простого бажання — читати ранобе українською мовою. Спочатку я робив його для себе, але якщо комусь цікаво також читати, перекладати, або навіть контрибютити на GitHub — я не проти!',
                  ),
                ]),
                p([
                  txt(
                    'ВуЧи — це не комерційний проект. Це спільнота ентузіастів, які хочуть зробити якісні переклади ранобе доступними для українських читачів.',
                  ),
                ]),
              ]),
            },
            {
              icon: 'Globe',
              iconColor: 'blue',
              title: 'Поточний стан проекту',
              content: root([
                p([
                  txt('Альфа версія: ', BOLD),
                  txt('Проект ще повністю не запущений, мало контенту, але базові функції працюють!'),
                ]),
                heading('h4', '✅ Що вже працює:'),
                ul([
                  'Читання новел',
                  'Збереження прогресу',
                  'Система ролей та доступу',
                  'Редагування контенту',
                  'Мобільна версія',
                ]),
                heading('h4', '🚧 В розробці:'),
                ul(['Більше контенту', 'Нові функції', 'Покращення UI/UX']),
              ]),
            },
            {
              icon: 'Code',
              iconColor: 'green',
              title: 'Технології',
              content: root([p([txt('TypeScript • Next.js • Payload CMS • MongoDB • React')])]),
            },
            {
              icon: 'Users',
              iconColor: 'purple',
              title: 'Розробник',
              content: root([p([txt('VeiaG', BOLD), txt(' — розробник проекту')])]),
              links: [
                {
                  label: 'veiag.dev',
                  url: 'https://veiag.dev',
                  variant: 'outline',
                  icon: 'ExternalLink',
                  newTab: true,
                },
                {
                  label: 'GitHub',
                  url: 'https://github.com/VeiaG/wuji',
                  variant: 'outline',
                  icon: 'Github',
                  newTab: true,
                },
              ],
            },
            {
              icon: 'GitPullRequest',
              iconColor: 'orange',
              title: 'Open Source',
              content: root([
                p([
                  txt(
                    'Проект повністю відкритий! Я готовий приймати зміни до коду через GitHub. Якщо ви розробник і хочете покращити проект — створюйте pull request.',
                  ),
                ]),
              ]),
              links: [
                {
                  label: 'Переглянути код',
                  url: 'https://github.com/VeiaG/wuji',
                  variant: 'default',
                  icon: 'Github',
                  newTab: true,
                },
                {
                  label: 'Повідомити про баг',
                  url: 'https://github.com/VeiaG/wuji/issues',
                  variant: 'outline',
                  icon: 'ExternalLink',
                  newTab: true,
                },
              ],
            },
            {
              icon: 'UserPlus',
              iconColor: 'cyan',
              title: 'Приєднуйтесь як редактор',
              content: root([
                p([
                  txt(
                    'Я не проти додавати нових редакторів, які можуть займатись перекладами своїх творів, використовуючи мій сайт. Сайт планую розвивати надалі, якщо вистачить охочих людей, які будуть займатись редагуванням та перекладом.',
                  ),
                ]),
                heading('h4', 'Умови співпраці:'),
                heading('h5', '✅ Нові новели:'),
                p([txt('Якщо хочете перекладати нову новелу — з радістю дам доступ!')]),
                heading('h5', '🤔 Існуючі новели:'),
                p([
                  txt(
                    'Для існуючих новел, де немає редакторів — розглядаю кожен випадок індивідуально. Сліпо давати доступ до редагування не буду, щоб уникнути вандалізму.',
                  ),
                ]),
                p([
                  txt("Як зв'язатися: ", BOLD),
                  txt('Напишіть мені в Telegram або залиште коментар у Telegram каналі.'),
                ]),
              ]),
            },
          ],
        },
        {
          blockType: 'separator',
          spacing: 'small',
        },
        {
          blockType: 'card-grid',
          columns: '2',
          cards: [
            {
              icon: 'Heart',
              iconColor: 'red',
              title: 'Підтримка проекту',
              content: root([
                p([
                  txt('Ваші пожертви допомагають оплачувати хостинг, ШІ переклад та розвиток сайту.'),
                ]),
                p([txt('Або переказати на картку: '), txt('4441 1111 2563 8183', BOLD)]),
              ]),
              links: [
                {
                  label: 'Підтримати через Monobank',
                  url: 'https://send.monobank.ua/jar/6TKEWNo6YR',
                  variant: 'default',
                  icon: 'Heart',
                  newTab: true,
                },
              ],
            },
            {
              icon: 'MessageCircle',
              iconColor: 'blue',
              title: 'Спільнота',
              content: root([
                p([txt('Приєднуйтесь до нашого Telegram каналу для новин та обговорень.')]),
                p([
                  txt(
                    'Тут ви можете слідкувати за оновленнями, залишати пропозиції та знаходити однодумців.',
                  ),
                ]),
              ]),
              links: [
                {
                  label: 'Telegram канал "ВуЧи"',
                  url: 'https://t.me/wuji_ranobes',
                  variant: 'default',
                  icon: 'MessageCircle',
                  newTab: true,
                },
              ],
            },
          ],
        },
        {
          blockType: 'rich-text',
          width: 'narrow',
          content: root([
            p([txt('Дякуємо, що підтримуєте українську спільноту любителів ранобе!')], 'center'),
            p([link('← Повернутися на головну', '/')], 'center'),
          ]),
        },
      ],
    },
  })

  payload.logger.info('Seeded "about" page')
}
