import { queryChapterByBookAndIndex } from '@/queries'
import { notFound } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'
import config from '@payload-config'
import ReadClientPage from './page.client'
import { Metadata } from 'next'
import { getServerSideURL } from '@/lib/getURL'

type Args = {
  params: Promise<{
    slug?: string
    page?: string
  }>
}

const ReadPage: React.FC<Args> = async ({ params }) => {
  const { slug = '', page = '' } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const chapter = await queryChapterByBookAndIndex({
    bookSlug: slug,
    index: Number(page),
  })
  if (!chapter) {
    notFound()
  }

  const updateReadProgress = async () => {
    if (user) {
      //save user read progress for this book

      //find book id
      const book = await payload.find({
        collection: 'books',
        limit: 1,
        select: {},
        where: {
          slug: {
            equals: slug,
          },
        },
      })
      const bookId = book?.docs[0]?.id
      //now find user read progress for this book
      const readProgress = (
        await payload.find({
          collection: 'readProgress',
          limit: 1,
          where: {
            user: {
              equals: user.id,
            },
            book: {
              equals: bookId,
            },
          },
        })
      )?.docs[0]
      if (readProgress) {
        //check if page is greater than current read progress
        if (Number(page) > readProgress.chapter) {
          await payload.update({
            collection: 'readProgress',
            id: readProgress.id,
            data: {
              chapter: Number(page),
            },
          })
        }
      } else {
        //if no read progress found, create one
        await payload.create({
          collection: 'readProgress',
          data: {
            user: user.id,
            book: bookId,
            chapter: Number(page),
          },
        })
      }
    }
  }
  updateReadProgress() // call the function to update read progress, but don't block the page render

  return <ReadClientPage chapter={chapter} page={Number(page)} bookSlug={slug} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '', page = '1' } = await paramsPromise
  const chapter = await queryChapterByBookAndIndex({
    bookSlug: slug,
    index: Number(page),
  })
  //remove images property entirely from metadata, and set them to our og image
  const ogImage = `${getServerSideURL()}/novel/${slug}/og`

  const book = typeof chapter.book === 'string' ? undefined : chapter.book
  const title = `ВуЧи - ${book?.title} : ${chapter.title}`
  return {
    title: title,
    description: book?.meta?.description,
    openGraph: {
      title: title,
      description: book?.meta?.description ?? undefined,
      images: [ogImage],
    },
  }
}

export default ReadPage
