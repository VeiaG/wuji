import type { Payload } from 'payload'

/**
 * Сідить глобал футера контентом колишнього хардкод-компонента.
 * Непрацюючі посилання (/popular, /genres/*) не переносяться.
 * Ідемпотентний: якщо колонки вже налаштовані — нічого не робить.
 */
export const seedFooter = async (payload: Payload) => {
  const footer = await payload.findGlobal({
    slug: 'footer',
  })

  if (footer?.columns?.length) return

  payload.logger.info('Seeding footer global...')

  await payload.updateGlobal({
    slug: 'footer',
    context: {
      disableRevalidate: true,
    },
    data: {
      description:
        'Найменша) українська платформа для читання ранобе. Відкрийте для себе світ японських, корейських та китайських новел українською мовою.',
      socialLinks: [
        { icon: 'Github', label: 'Github', url: 'https://github.com/veiag/wuji' },
        { icon: 'Send', label: 'Telegram', url: 'https://t.me/wuji_ranobes' },
      ],
      columns: [
        {
          title: 'Навігація',
          links: [
            { label: 'Головна', url: '/' },
            { label: 'Всі ранобе', url: '/novels' },
            { label: 'Блог', url: '/blog' },
          ],
        },
        {
          title: 'Інформація',
          links: [
            { label: 'Про нас', url: '/about' },
            { label: 'Контакти', url: 'https://veiag.dev/', newTab: true },
            { label: 'Умови використання', url: '/terms' },
            { label: 'Політика конфіденційності', url: '/privacy' },
          ],
        },
      ],
      copyright: 'ВуЧи. Всі права захищені.',
    },
  })

  payload.logger.info('Seeded footer global')
}
