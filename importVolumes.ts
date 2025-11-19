import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

type Volume = {
  title: string
  startChapter: number
  endChapter: number
  /**
   * Not used, just for reference
   */
  totalChapters: number
}
const slug = 'misto-hrikha'

const volumes: Volume[] = [
  {
    title: 'Книга 1 - Зоря, що сходить',
    startChapter: 1,
    endChapter: 134,
    totalChapters: 134,
  },
  {
    title: 'Книга 2 - Моє завоювання — море зірок',
    startChapter: 135,
    endChapter: 353,
    totalChapters: 219,
  },
  {
    title: 'Книга 3 - Гуляючи з примарами вдень',
    startChapter: 354,
    endChapter: 509,
    totalChapters: 156,
  },
  {
    title: 'Книга 4 - Обіймаючи широкий світ',
    startChapter: 510,
    endChapter: 682,
    totalChapters: 173,
  },
  {
    title: 'Книга 5 - Полум’я вічної ночі',
    startChapter: 683,
    endChapter: 792,
    totalChapters: 110,
  },
  {
    title: 'Книга 6 - Краса диму і вогню',
    startChapter: 793,
    endChapter: 958,
    totalChapters: 166,
  },
  {
    title: 'Книга 7 - Минуща слава',
    startChapter: 959,
    endChapter: 1155,
    totalChapters: 197,
  },
  {
    title: 'Книга 8 - Спад місяця',
    startChapter: 1156,
    endChapter: 1292,
    totalChapters: 137,
  },
  {
    title: 'Книга 9 - До краю світу',
    startChapter: 1293,
    endChapter: 1439,
    totalChapters: 147,
  },
]

const main = async () => {
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
  //Update book
  await payload.update({
    collection: 'books',
    id: bookId,
    data: {
      volumes: volumes.map((volume) => ({
        name: volume.title,
        from: volume.startChapter,
        to: volume.endChapter,
      })),
    },
  })

  console.log('🎉 All files processed')
}
main()
