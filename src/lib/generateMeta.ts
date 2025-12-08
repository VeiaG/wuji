import type { Metadata } from 'next'

import type { Media, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/og-template.jpg'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

type GenerateMetaArgs = {
  doc: Partial<Post> | null
  /** Наприклад, для книжок */
  type?: 'book' | 'post'
  /** Додатковий хвостик у title */
  titleSuffix?: string
  /** Альтернативні назви, жанри, теги */
  tags?: string[]
}

export const generateMeta = async ({
  doc,
  titleSuffix,
  tags,
}: GenerateMetaArgs): Promise<Metadata> => {
  const ogImage = getImageURL(doc?.meta?.image)

  // базовий title
  let title = doc?.meta?.title ? 'ВуЧи - ' + doc?.meta?.title : 'ВуЧи'
  if (titleSuffix) title += ' ' + titleSuffix

  const description = doc?.meta?.description

  const meta: Metadata = {
    title,
    description,
    openGraph: mergeOpenGraph({
      description: description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
  }
  if (tags && tags.length) {
    meta.keywords = tags.join(', ')
  }

  return meta
}
