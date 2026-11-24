import type { MongooseAdapter } from '@payloadcms/db-mongodb'

/**
 * Складений індекс `{ _bookChapters_chapters_order: 1, createdAt: 1 }` на розділах.
 *
 * Перед створенням розділу orderable-хук Payload шукає «останній» ключ порядку
 * (`sort: -_bookChapters_chapters_order`, `limit: 1`), а Mongo-адаптер додає до сортування
 * `createdAt`. Для розділу книги пошук звужено фільтром `book`, а для розділу заявки (без
 * книги) він іде по всій колекції: одного індексу на ключі порядку замало для сортування
 * з `createdAt`, тож Mongo читає й сортує всі розділи — сотні мс … секунди на кожне
 * створення. З цим індексом — один документ.
 *
 * Через `afterOpenConnection`, а не `indexes` колекції: поле порядку orderable додає вже
 * після перевірки складених індексів, і `indexes` з ним падає на старті. `createIndex`
 * ідемпотентний: наявний індекс з тим самим ключем нічого не робить.
 */
export async function ensureChapterOrderIndex(adapter: MongooseAdapter): Promise<void> {
  try {
    const collection =
      adapter.collections?.bookChapters?.collection ?? adapter.connection.collection('bookchapters')
    await collection.createIndex({ _bookChapters_chapters_order: 1, createdAt: 1 })
  } catch (error) {
    // без індексу все працює, лише повільніше — старт не валимо
    adapter.payload?.logger?.error({ err: error, msg: 'Не вдалося створити індекс порядку розділів' })
  }
}
