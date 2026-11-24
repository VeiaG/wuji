import type {
  Access,
  AccessResult,
  FilterOptions,
  PayloadRequest,
  RelationshipFieldSingleValidation,
  Where,
} from 'payload'
import { relationship } from 'payload/shared'
import type { TFunction } from '@payloadcms/translations'
import type { CustomTranslationsKeys } from '@/translations'
import type { User } from '@/payload-types'
import { checkRole } from './checkRole'

//createdBy з core authorship v4 — поліморфне поле { relationTo, value }
export const ownBookRequestsWhere = (user: Pick<User, 'id'>): Where => ({
  'createdBy.value': { equals: user.id },
})

const OWN_REQUEST_IDS_CONTEXT_KEY = 'ownBookRequestIds'

/**
 * Id заявок, створених поточним користувачем. Розділи заявок фільтруємо через
 * `bookRequest in [...]`, а не через шлях `bookRequest.createdBy.value` — запит
 * крізь відношення в поліморфне поле в Mongo-адаптері ненадійний.
 * Кешується в req.context на час запиту (access викликається кілька разів).
 */
export const getOwnBookRequestIds = async (req: PayloadRequest): Promise<string[]> => {
  if (!req.user) return []
  const cached = req.context?.[OWN_REQUEST_IDS_CONTEXT_KEY]
  if (Array.isArray(cached)) return cached as string[]

  const { docs } = await req.payload.find({
    collection: 'bookRequests',
    where: ownBookRequestsWhere(req.user),
    depth: 0,
    pagination: false,
    select: { title: true },
    overrideAccess: true,
    req,
  })
  const ids = docs.map((doc) => String(doc.id))
  if (req.context) req.context[OWN_REQUEST_IDS_CONTEXT_KEY] = ids
  return ids
}

export const adminsAndEditors: Access = ({ req: { user } }) =>
  checkRole(['admin', 'editor'], user as User | null)

//адмін — усі заявки, редактор — лише свої
export const readBookRequests: Access = ({ req: { user } }): AccessResult => {
  if (!user) return false
  if (checkRole(['admin'], user as User)) return true
  if (checkRole(['editor'], user as User)) return ownBookRequestsWhere(user)
  return false
}

//редактор правит свої заявки, поки їх не перенесено в книгу
export const updateBookRequests: Access = ({ req: { user } }): AccessResult => {
  if (!user) return false
  if (checkRole(['admin'], user as User)) return true
  if (checkRole(['editor'], user as User)) {
    return { and: [ownBookRequestsWhere(user), { requestStatus: { equals: 'new' } }] }
  }
  return false
}

const relValueId = (val: unknown): string | null => {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'object') {
    const v = val as { id?: unknown; value?: unknown }
    if (v.value !== undefined) return relValueId(v.value)
    if (v.id !== undefined) return String(v.id)
    return null
  }
  return String(val)
}

/**
 * Валідація `bookChapters.bookRequest`:
 * - розділ належить рівно одному: або книзі (`book`), або заявці (`bookRequest`);
 * - редактор може вказати лише власну заявку, ще не перенесену в книгу.
 */
export const chapterBookRequestValidation: RelationshipFieldSingleValidation = async (
  val,
  args,
) => {
  const { req, siblingData } = args
  const t = req.t as TFunction<CustomTranslationsKeys>
  const requestId = relValueId(val)
  const bookId = relValueId((siblingData as { book?: unknown } | undefined)?.book)

  if (!requestId && !bookId) return t('books:chapterNeedsBookOrRequest')
  if (requestId && bookId) return t('books:chapterBookAndRequest')
  if (!requestId) return relationship(val, args)

  const { user } = req
  if (user && !checkRole(['admin'], user as User)) {
    const bookRequest = await req.payload
      .findByID({ collection: 'bookRequests', id: requestId, depth: 0, overrideAccess: true, req })
      .catch(() => null)
    const isOwn = relValueId(bookRequest?.createdBy) === String(user.id)
    if (!bookRequest || !isOwn || bookRequest.requestStatus === 'attached') {
      return t('books:noAccessToBookRequest')
    }
  }
  return relationship(val, args)
}

//у пікері заявки показуємо лише неперенесені; редактору — лише свої
export const bookRequestFilterOptions: FilterOptions = ({ req }) => {
  const notAttached: Where = { requestStatus: { equals: 'new' } }
  if (req.user && !checkRole(['admin'], req.user as User)) {
    return { and: [notAttached, ownBookRequestsWhere(req.user)] }
  }
  return notAttached
}
