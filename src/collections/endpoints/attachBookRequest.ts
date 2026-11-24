import type { Endpoint } from 'payload'
import { checkRole } from '@/collections/access/checkRole'

const relId = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') {
    const v = value as { id?: unknown; value?: unknown }
    // поліморфне { relationTo, value } або популяризований документ
    if (v.value !== undefined) return relId(v.value)
    if (v.id !== undefined) return String(v.id)
    return null
  }
  return String(value)
}

/**
 * POST /api/bookRequests/:id/attach  { bookId }
 * Переносить усі розділи заявки в книгу (лише admin).
 *
 * Порядок розділів зберігається: ключ `_bookChapters_chapters_order` генерується один раз
 * при створенні розділу і масовий update поля `book` його не перегенеровує. Тому
 * перенесення дозволене лише в порожню книгу.
 */
export const attachBookRequestEndpoint: Endpoint = {
  path: '/:id/attach',
  method: 'post',
  handler: async (req) => {
    const { payload } = req
    if (!checkRole(['admin'], req.user)) {
      return Response.json({ error: 'Недостатньо прав' }, { status: 403 })
    }

    const requestId = typeof req.routeParams?.id === 'string' ? req.routeParams.id : null
    const body = (await req.json?.().catch(() => null)) as { bookId?: unknown } | null
    const bookId = typeof body?.bookId === 'string' ? body.bookId : null
    if (!requestId || !bookId) {
      return Response.json({ error: 'Очікується { bookId }' }, { status: 400 })
    }

    const bookRequest = await payload
      .findByID({ collection: 'bookRequests', id: requestId, depth: 0, overrideAccess: true, req })
      .catch(() => null)
    if (!bookRequest) {
      return Response.json({ error: 'Заявку не знайдено' }, { status: 404 })
    }
    if (bookRequest.requestStatus === 'attached') {
      return Response.json({ error: 'Заявку вже перенесено в книгу' }, { status: 409 })
    }

    const book = await payload
      .findByID({ collection: 'books', id: bookId, depth: 0, overrideAccess: true, req })
      .catch(() => null)
    if (!book) {
      return Response.json({ error: 'Книгу не знайдено' }, { status: 404 })
    }

    // Повтор після часткового збою: заявка вже вказує на цю книгу, тож розділи, що вже
    // в книзі, прийшли з цієї ж заявки — перевірку на порожню книгу пропускаємо.
    // Повтор в іншу книгу розніс би розділи по двох книгах — забороняємо.
    const recordedBookId = relId(bookRequest.book)
    if (recordedBookId && recordedBookId !== String(book.id)) {
      return Response.json(
        {
          error:
            'Перенесення цієї заявки вже почалося в іншу книгу. Повторіть його в ту саму книгу.',
        },
        { status: 409 },
      )
    }
    const isRetry = recordedBookId === String(book.id)
    if (!isRetry) {
      const existing = await payload.count({
        collection: 'bookChapters',
        where: { book: { equals: book.id } },
        overrideAccess: true,
        req,
      })
      if (existing.totalDocs > 0) {
        return Response.json(
          {
            error: `У книзі вже є розділи (${existing.totalDocs}). Перенесення можливе лише в порожню книгу.`,
          },
          { status: 409 },
        )
      }
      // маркер «перенесення почалося»: з цього моменту валідація розділів не пускає нові
      // розділи в заявку (див. chapterBookRequestValidation)
      await payload.update({
        collection: 'bookRequests',
        id: requestId,
        data: { book: book.id },
        overrideAccess: true,
        req,
      })
    }

    // Розділ, що пройшов валідацію ще до маркера, може записатися вже після першого
    // проходу — тому переносимо, доки в заявці нічого не лишиться
    let movedCount = 0
    for (let pass = 0; ; pass++) {
      const moved = await payload.update({
        collection: 'bookChapters',
        where: { bookRequest: { equals: requestId } },
        data: { book: book.id, bookRequest: null, addedAt: new Date().toISOString() },
        depth: 0,
        overrideAccess: true,
        context: { skipRecountingChapters: true },
        req,
      })
      movedCount += moved.docs.length
      if (moved.errors.length > 0) {
        payload.logger.error({
          msg: `Book request ${requestId}: ${moved.errors.length} chapters failed to move`,
          errors: moved.errors,
        })
        return Response.json(
          {
            error: `Не вдалося перенести ${moved.errors.length} розділ(ів). Спробуйте ще раз — уже перенесені лишаться в книзі.`,
            moved: movedCount,
          },
          { status: 500 },
        )
      }
      const left = await payload.count({
        collection: 'bookChapters',
        where: { bookRequest: { equals: requestId } },
        overrideAccess: true,
        req,
      })
      if (left.totalDocs === 0) break
      if (pass >= 2) {
        return Response.json(
          {
            error: `У заявці досі ${left.totalDocs} розділ(ів). Спробуйте ще раз.`,
            moved: movedCount,
          },
          { status: 500 },
        )
      }
    }

    // один перерахунок замість перерахунку на кожен розділ
    const chapterCount = await payload.count({
      collection: 'bookChapters',
      where: { book: { equals: book.id } },
      overrideAccess: true,
      req,
    })
    await payload.update({
      collection: 'books',
      id: book.id,
      data: { chapterCount: chapterCount.totalDocs },
      overrideAccess: true,
      req,
    })

    // редактор, що створив заявку, отримує доступ до книги
    const authorId = relId(bookRequest.createdBy)
    if (authorId) {
      // find, а не findByID: відсутній автор (видалений акаунт) — це просто порожній
      // результат, а справжня помилка запиту летить далі, і заявка лишається неперенесеною
      // (повтор у ту саму книгу її завершить)
      const {
        docs: [author],
      } = await payload.find({
        collection: 'users',
        where: { id: { equals: authorId } },
        depth: 0,
        limit: 1,
        pagination: false,
        overrideAccess: true,
        req,
      })
      if (author && checkRole(['editor'], author)) {
        const access = (author.bookAccess ?? []).map((b) => relId(b)).filter(Boolean) as string[]
        if (!access.includes(String(book.id))) {
          await payload.update({
            collection: 'users',
            id: author.id,
            data: { bookAccess: [...access, String(book.id)] },
            overrideAccess: true,
            req,
          })
        }
      }
    }

    await payload.update({
      collection: 'bookRequests',
      id: requestId,
      data: { requestStatus: 'attached', book: book.id },
      overrideAccess: true,
      req,
    })

    return Response.json({ moved: movedCount, bookId: book.id })
  },
}
