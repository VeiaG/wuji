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
const slug = 'prynts-drakona-yuan'

const volumes: Volume[] = [
  {
    "title": "Сім Глибоких Бойових Шкіл",
    "startChapter": 1,
    "endChapter": 106,
    "totalChapters": 106
  },
  {
    "title": "Східна зірка Королівства Небесної Долі",
    "startChapter": 107,
    "endChapter": 166,
    "totalChapters": 60
  },
  {
    "title": "Пригоди в Південній Пустці",
    "startChapter": 167,
    "endChapter": 224,
    "totalChapters": 58
  },
  {
    "title": "Всеосяжна Бойова Зустріч Фракцій",
    "startChapter": 225,
    "endChapter": 301,
    "totalChapters": 77
  },
  {
    "title": "Інтриги в Місті Зеленого Шовковиці",
    "startChapter": 302,
    "endChapter": 354,
    "totalChapters": 53
  },
  {
    "title": "Острів Божественного Фенікса",
    "startChapter": 355,
    "endChapter": 410,
    "totalChapters": 56
  },
  {
    "title": "Месник",
    "startChapter": 411,
    "endChapter": 439,
    "totalChapters": 29
  },
  {
    "title": "Поле битви Південного Моря",
    "startChapter": 440,
    "endChapter": 514,
    "totalChapters": 75
  },
  {
    "title": "Прокляття Степів Кривавої Бійні",
    "startChapter": 515,
    "endChapter": 670,
    "totalChapters": 156
  },
  {
    "title": "Жах Південного Моря",
    "startChapter": 671,
    "endChapter": 754,
    "totalChapters": 84
  },
  {
    "title": "Полювання Божественного Королівства Асур",
    "startChapter": 755,
    "endChapter": 872,
    "totalChapters": 118
  },
  {
    "title": "Змова Стародавнього Диявола",
    "startChapter": 873,
    "endChapter": 953,
    "totalChapters": 81
  },
  {
    "title": "Клан Стародавнього Фенікса",
    "startChapter": 954,
    "endChapter": 1075,
    "totalChapters": 122
  },
  {
    "title": "Справжній Бойовий Світ",
    "startChapter": 1076,
    "endChapter": 1156,
    "totalChapters": 81
  },
  {
    "title": "Генії Першої Бойової Зустрічі Божественного Царства",
    "startChapter": 1157,
    "endChapter": 1332,
    "totalChapters": 176
  },
  {
    "title": "Повернення до Безодні",
    "startChapter": 1333,
    "endChapter": 1394,
    "totalChapters": 62
  },
  {
    "title": "Шлях Асур",
    "startChapter": 1395,
    "endChapter": 1546,
    "totalChapters": 152
  },
  {
    "title": "Місто Божественних Рун",
    "startChapter": 1547,
    "endChapter": 1659,
    "totalChapters": 113
  },
  {
    "title": "Спадщина Останнього Випробування",
    "startChapter": 1660,
    "endChapter": 1752,
    "totalChapters": 93
  },
  {
    "title": "Віра і Лють",
    "startChapter": 1753,
    "endChapter": 1800,
    "totalChapters": 48
  },
  {
    "title": "Таємниці Поля Бою Акашічних Снів",
    "startChapter": 1801,
    "endChapter": 1870,
    "totalChapters": 70
  },
  {
    "title": "Політ Стародавніх Рас",
    "startChapter": 1871,
    "endChapter": 1934,
    "totalChapters": 64
  },
  {
    "title": "Самсара Життя і Смерті",
    "startChapter": 1935,
    "endChapter": 2024,
    "totalChapters": 90
  },
  {
    "title": "Світло у Темряві",
    "startChapter": 2025,
    "endChapter": 2100,
    "totalChapters": 76
  },
  {
    "title": "Глибини Безодні",
    "startChapter": 2101,
    "endChapter": 2216,
    "totalChapters": 116
  },
  {
    "title": "Остання Битва 33 Небес",
    "startChapter": 2217,
    "endChapter": 2277,
    "totalChapters": 61
  }
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
await main()
