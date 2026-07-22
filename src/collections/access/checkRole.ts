import { Book, User } from '@/payload-types'

export const checkRole = (allRoles: User['roles'] = [], user: User | null = null): boolean => {
  if (user) {
    if (
      allRoles.some((role) => {
        return user?.roles?.some((individualRole) => {
          return individualRole === role
        })
      })
    ) {
      return true
    }
  }

  return false
}

/**
 * Чи може користувач редагувати конкретну книгу.
 * Адміни — будь-яку книгу; редактори — лише ті, до яких мають доступ (bookAccess);
 * письменники — лише власні книги (owner).
 */
export const canEditBook = (user: User | null, book: Pick<Book, 'id' | 'owner'>): boolean => {
  if (!user) return false
  if (checkRole(['admin'], user)) return true
  if (checkRole(['editor'], user)) {
    const bookId = String(book.id)
    if (
      (user.bookAccess || []).some((b) =>
        typeof b === 'string' ? b === bookId : String(b.id) === bookId,
      )
    ) {
      return true
    }
  }
  if (checkRole(['writer'], user)) {
    const ownerId = typeof book.owner === 'object' && book.owner !== null ? book.owner.id : book.owner
    if (ownerId && String(ownerId) === String(user.id)) return true
  }
  return false
}
