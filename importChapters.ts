import { promises as fs } from 'fs'

import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'
import config from '@payload-config'
console.log('Pre-running importChapters script')
const payload = await getPayload({ config })

const startIndex = 1
const endIndex = 2015
const slug = 'idealnyy-svit'
const ovverrideExisting = true

const processFile = async (i: number, bookID: string, isLast?: boolean) => {
  const configAwaited = await config
  console.log(`Processing file #${i}`)
  try {
    const fileName = `./translation/${i.toString().padStart(5, '0')}.json`
    const file = await fs.readFile(fileName, 'utf-8')
    const json = JSON.parse(file)

    const lexicalJSON = convertMarkdownToLexical({
      editorConfig: await editorConfigFactory.default({
        config: configAwaited,
      }),
      markdown: json.content,
    })
    const chapter = await payload.create({
      collection: 'bookChapters',
      data: {
        title: json?.title,
        content: lexicalJSON,
        book: bookID,
      },
      context: {
        skipRecountingChapters: !isLast, // Skip recounting for all but the last chapter
      },
    })
  } catch (error) {
    console.error(`Error reading file #${i}:`, error)
    //get error message
    console.log(error?.data?.errors)
    return
  }
}
const main = async () => {
  console.log('Starting import process')
  const book = await payload.find({
    collection: 'books',
    limit: 1,
    pagination: false,
    depth: 2,
    where: {
      slug: {
        equals: slug,
      },
    },
  })
  if (!book.docs?.[0]) {
    console.error('Book not found')
    return
  }
  const bookId = book.docs[0].id
  console.log('Book ID:', bookId)
  const { totalDocs } = await payload.count({
    collection: 'bookChapters',
    where: {
      book: { equals: bookId },
    },
  })
  if (ovverrideExisting && totalDocs > 0 && startIndex === 1) {
    console.log('Ovverriding existing chapters. Deleting existing chapters...')
    await payload.delete({
      collection: 'bookChapters',
      where: {
        book: { equals: bookId },
      },
      context: {
        skipRecountingChapters: true, // Skip recounting when deleting existing chapters
        //Should be much faster lmao. But i didn't saw any logs for deleteing idk
      },
    })
    console.log(`Existing ${totalDocs} chapters deleted. Query used :`, {
      collection: 'bookChapters',
      where: {
        book: { equals: bookId },
      },
    })
  }
  if (totalDocs >= endIndex && startIndex === 1 && !ovverrideExisting) {
    console.log(
      `Chapters already imported. There are ${totalDocs}/${endIndex} chapters. Exiting import.`,
    )
    return
  }

  for (let i = startIndex; i <= endIndex; i += 1) {
    await processFile(i, bookId, i === endIndex)
  }

  console.log('🎉 All files processed')
}
console.log('Running importChapters script')
await main()
