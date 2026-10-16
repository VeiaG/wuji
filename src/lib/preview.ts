import type { CollectionConfig } from 'payload'
import { getDocPath, type LinkableCollection } from './docPath'

/** Безпечний внутрішній шлях: лише відносний, без `//host` (open redirect). */
export const isSafePreviewPath = (path: unknown): path is string =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')

/** URL, що вмикає draft mode і веде на сторінку документа. null — якщо slug ще немає. */
export const getPreviewURL = (collection: LinkableCollection, doc: unknown): string | null => {
  const path = getDocPath(collection, doc)
  if (!path) return null
  return `/next/preview?path=${encodeURIComponent(path)}`
}

/** Live preview (iframe в адмінці) + кнопка «Переглянути» для колекції з чернетками. */
export const previewAdminConfig = (
  collection: LinkableCollection,
): Pick<NonNullable<CollectionConfig['admin']>, 'livePreview' | 'preview'> => ({
  livePreview: {
    url: ({ data }) => getPreviewURL(collection, data) ?? '',
    breakpoints: [
      { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
      { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
      { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
    ],
  },
  preview: (doc) => getPreviewURL(collection, doc),
})
