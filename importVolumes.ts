import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

type Volume = {
  title: string
  startChapter: number
  endChapter: number
}
const slug = 'henialnyy-detektyv'

const volumes: Volume[] = [
  {
    title: 'Том 1 – Таємничий водій',
    startChapter: 1,
    endChapter: 14,
  },
  {
    title: 'Том 2 – Родинна різанина',
    startChapter: 15,
    endChapter: 34,
  },
  {
    title: 'Том 3 – Труп жінки без голови',
    startChapter: 35,
    endChapter: 52,
  },
  {
    title: 'Том 4 – Чужа дитина',
    startChapter: 53,
    endChapter: 65,
  },
  {
    title: 'Том 5 – Їхні стосунки',
    startChapter: 66,
    endChapter: 79,
  },
  {
    title: 'Том 6 – Щасливчик',
    startChapter: 80,
    endChapter: 89,
  },
  {
    title: 'Том 7 – Батько насправді...?',
    startChapter: 90,
    endChapter: 100,
  },
  {
    title: 'Том 8 – Спокійна ніч була не такою вже й спокійною',
    startChapter: 101,
    endChapter: 114,
  },
  {
    title: 'Том 9 – Друже, ти придбав страховку?',
    startChapter: 115,
    endChapter: 137,
  },
  {
    title: 'Том 10 – Таємниця',
    startChapter: 138,
    endChapter: 148,
  },
  {
    title: 'Том 11 – Сімейні справи багатіїв',
    startChapter: 149,
    endChapter: 170,
  },
  {
    title: 'Том 12 – Справа вбивства бабусею Лю когось',
    startChapter: 171,
    endChapter: 188,
  },
  {
    title: 'Том 13 – Останнє повернення',
    startChapter: 189,
    endChapter: 199,
  },
  {
    title: 'Том 14 – Аварійна посадка',
    startChapter: 200,
    endChapter: 206,
  },
  {
    title: 'Том 15 – Під людською шкірою',
    startChapter: 207,
    endChapter: 231,
  },
  {
    title: 'Том 16 – Ладонь і тильний бік руки — все м’ясо',
    startChapter: 232,
    endChapter: 245,
  },
  {
    title: 'Том 17 – Найбільша брехня у світі',
    startChapter: 246,
    endChapter: 262,
  },
  {
    title: 'Том 18 – Ім’ям кохання',
    startChapter: 263,
    endChapter: 280,
  },
  {
    title: 'Том 19 – Вбивство кришечкою',
    startChapter: 281,
    endChapter: 298,
  },
  {
    title: 'Том 20 – Божевільний мандрівник у часі',
    startChapter: 299,
    endChapter: 313,
  },
  {
    title: 'Том 21 – Майстер гіпнозу',
    startChapter: 314,
    endChapter: 328,
  },
  {
    title: 'Том 22 – Помста слабкої жінки',
    startChapter: 329,
    endChapter: 349,
  },
  {
    title: 'Том 23 – Інцидент на вступних іспитах',
    startChapter: 350,
    endChapter: 359,
  },
  {
    title: 'Том 24 – Метаморфоза',
    startChapter: 360,
    endChapter: 371,
  },
  {
    title: 'Том 25 – Промінь світла серед темряви',
    startChapter: 372,
    endChapter: 379,
  },
  {
    title: 'Том 26 – Переслідування вбивці у сні',
    startChapter: 380,
    endChapter: 390,
  },
  {
    title: 'Том 27 – Тіло дитини на безплідній горі',
    startChapter: 391,
    endChapter: 402,
  },
  {
    title: 'Том 28 – Кровожерлива муза',
    startChapter: 403,
    endChapter: 428,
  },
  {
    title: 'Том 29 – Озброєні',
    startChapter: 429,
    endChapter: 455,
  },
  {
    title: 'Том 30 – Примарна рушниця',
    startChapter: 456,
    endChapter: 472,
  },
  {
    title: 'Том 31 – Учні',
    startChapter: 473,
    endChapter: 488,
  },
  {
    title: 'Том 32 – Не забувай мене',
    startChapter: 489,
    endChapter: 508,
  },
  {
    title: 'Том 33 – Смак дідуся',
    startChapter: 509,
    endChapter: 522,
  },
  {
    title: 'Том 34 – Раптове зникнення',
    startChapter: 523,
    endChapter: 537,
  },
  {
    title: 'Том 35 – Мертвий японець',
    startChapter: 538,
    endChapter: 546,
  },
  {
    title: 'Том 36 – Чому загинула А Чжень?',
    startChapter: 547,
    endChapter: 557,
  },
  {
    title: 'Том 37 – Не наближайся до незнайомців',
    startChapter: 558,
    endChapter: 568,
  },
  {
    title: 'Том 38 – Відродження в новій подобі',
    startChapter: 569,
    endChapter: 584,
  },
  {
    title: 'Том 39 – Розділений злочин',
    startChapter: 585,
    endChapter: 596,
  },
  {
    title: 'Том 40 – Любов до дому',
    startChapter: 597,
    endChapter: 613,
  },
  {
    title: 'Том 41 – Страждання об’єднують',
    startChapter: 614,
    endChapter: 631,
  },
  {
    title: 'Том 42 – Невідома отрута',
    startChapter: 632,
    endChapter: 648,
  },
  {
    title: 'Том 43 – З’явився фенікс',
    startChapter: 649,
    endChapter: 671,
  },
  {
    title: 'Том 44 – Життя маріонетки',
    startChapter: 672,
    endChapter: 692,
  },
  {
    title: 'Том 45 – Утримування автора',
    startChapter: 693,
    endChapter: 716,
  },
  {
    title: 'Том 46 – Яке ж ти сміття?',
    startChapter: 717,
    endChapter: 742,
  },
  {
    title: 'Том 47 – Вбивство через обмін снами',
    startChapter: 743,
    endChapter: 772,
  },
  {
    title: 'Том 48 – Лін Цюпу, новачок',
    startChapter: 773,
    endChapter: 812,
  },
  {
    title: 'Том 49 – Усе втрачено',
    startChapter: 813,
    endChapter: 826,
  },
  {
    title: 'Том 50 – Не чіпай моїх рисових полів',
    startChapter: 827,
    endChapter: 851,
  },
  {
    title: 'Том 51 – Диявольський діагноз',
    startChapter: 852,
    endChapter: 872,
  },
  {
    title: 'Том 52 – Щоденник убивств Тао Юеюе',
    startChapter: 873,
    endChapter: 883,
  },
  {
    title: 'Том 53 – Шлях додому Тао Юеюе',
    startChapter: 884,
    endChapter: 909,
  },
  {
    title: 'Том 54 – Краще вклонятися дияволу, ніж молитися богам',
    startChapter: 910,
    endChapter: 937,
  },
  {
    title: 'Том 55 – Маленький геніальний детектив',
    startChapter: 938,
    endChapter: 955,
  },
  {
    title: 'Останній том – Спостерігач за людством',
    startChapter: 956,
    endChapter: 983,
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
