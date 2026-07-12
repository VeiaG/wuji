import { User } from '@/payload-types'

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
 * Адміни — будь-яку книгу; редактори — лише ті, до яких мають доступ (bookAccess).
 */
export const canEditBook = (user: User | null, bookId: string): boolean => {
  if (!user) return false
  if (checkRole(['admin'], user)) return true
  if (checkRole(['editor'], user)) {
    return (user.bookAccess || []).some((book) =>
      typeof book === 'string' ? book === bookId : String(book.id) === bookId,
    )
  }
  return false
}
