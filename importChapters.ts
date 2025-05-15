import { promises as fs } from 'fs'

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const startIndex = 1179
const endIndex = 1186

const processFile = async (i: number, bookID: string) => {
  const configAwaited = await config
  console.log(`Processing file #${i}`)
  try {
    const fileName = `output/${i.toString().padStart(5, '0')}.json`
    const file = await fs.readFile(fileName, 'utf-8')
    const json = JSON.parse(file)

    const lexicalJSON = convertMarkdownToLexical({
      editorConfig: await editorConfigFactory.default({
        config: configAwaited,
      }),
      markdown: json.body,
    })

    const chapter = await payload.create({
      collection: 'bookChapters',
      data: {
        title: json?.title,
        //@ts-expect-errort - type mismatch
        content: lexicalJSON,
        book: bookID,
      },
    })
  } catch (error) {
    console.error(`Error reading file #${i}:`, error)
    return
  }
}
const main = async () => {
  const book = await payload.find({
    collection: 'books',
    limit: 1,
    pagination: false,
    depth: 2,
    where: {
      slug: {
        equals: 'za-mezhamy-chasoprostoru',
      },
    },
  })
  if (!book.docs?.[0]) {
    console.error('Book not found')
    return
  }
  const bookId = book.docs[0].id
  console.log('Book ID:', bookId)
  for (let i = startIndex; i <= endIndex; i += 1) {
    await processFile(i, bookId)
  }

  console.log('🎉 All files processed')
}
main()
