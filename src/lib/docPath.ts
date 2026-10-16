/**
 * Колекції, на документи яких можна посилатись із Lexical (LinkFeature → «Внутрішнє посилання»).
 * Посилання зберігає зв'язок з документом, а URL будується під час рендеру,
 * тож зміна slug не ламає лінки в описах і постах.
 */
export const linkableCollections = ['books', 'authors', 'posts', 'pages'] as const

export type LinkableCollection = (typeof linkableCollections)[number]

const pathPrefixes: Record<LinkableCollection, string> = {
  books: '/novel/',
  authors: '/author/',
  posts: '/blog/',
  pages: '/',
}

/**
 * Шлях до документа на сайті. Повертає null, якщо документ не підтягнутий
 * (лише id — недостатній depth або документ видалено) чи колекція не підтримується.
 */
export const getDocPath = (relationTo: string, doc: unknown): string | null => {
  if (!(relationTo in pathPrefixes) || !doc || typeof doc !== 'object') return null
  const { slug } = doc as { slug?: unknown }
  if (typeof slug !== 'string' || !slug) return null
  return `${pathPrefixes[relationTo as LinkableCollection]}${slug}`
}
