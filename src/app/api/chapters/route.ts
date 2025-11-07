import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'

export const GET = async (request: NextRequest) => {
  const payload = await getPayload({
    config,
  })

  //Get query params
  const { searchParams } = new URL(request.url)
  const novelSlug = searchParams.get('slug')
  if (!novelSlug) {
    return new Response(JSON.stringify({ error: 'Missing novel slug' }), { status: 400 })
  }
  const page = searchParams.get('page') || '1'
  const limit = searchParams.get('limit') || '10'
  const pageNumber = parseInt(page, 10)
  const limitNumber = parseInt(limit, 10)
  try {
    const chapters = await payload.find({
      collection: 'bookChapters',
      where: { 'book.slug': { equals: novelSlug } },
      select: {
        title: true,
        content: true,
      },
      //sort by internal join field order
      sort: '_bookChapters_chapters_order',
      limit: limitNumber,
      page: pageNumber,
    })
    const returnObject: {
      title: string
      content: string
    }[] = chapters?.docs.map((chapter) => {
      let plainTextContent = 'Error converting content'
      try {
        const contentData = chapter.content as SerializedEditorState
        plainTextContent = convertLexicalToPlaintext({
          data: contentData,
        })
      } catch (error) {
        console.error('Error converting chapter content:', error)
      }
      return {
        title: chapter.title,
        content: plainTextContent,
      }
    })
    return NextResponse.json(
      {
        docs: returnObject,
        totalDocs: chapters.totalDocs,
        page: chapters.page,
        totalPages: chapters.totalPages,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error fetching chapters:', error)
    return NextResponse.json({ error: 'Error fetching chapters' }, { status: 500 })
  }
}
