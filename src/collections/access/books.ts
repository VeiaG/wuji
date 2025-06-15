import {
  Access,
  AccessResult,
  BaseListFilter,
  FilterOptions,
  RelationshipFieldSingleValidation,
  ValidationError,
  Where,
} from 'payload'
import { checkRole } from './checkRole'
import { Book, BookChapter } from '@/payload-types'
import { FieldHook } from 'payload'
import { relationship } from 'payload/shared'
import { TFunction } from '@payloadcms/translations'
import { CustomTranslationsKeys } from '@/translations'

const adminsAndEditorsBook: Access<Book> = ({ req: { user } }): AccessResult => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }
    if (checkRole(['editor'], user)) {
      //check if user is editor for current document (book)
      if (user.bookAccess) {
        //building where clause for bookAccess
        const query: Where = {
          id: {
            in:
              user?.bookAccess?.map((bookId) => {
                return typeof bookId === 'string' ? bookId : bookId.id
              }) || [],
          },
        }
        return query
      }
    }
  }
  return false
}
//This access control will be used for creating/updating chapters
const adminsAndEditorsChapters: Access<BookChapter> = ({ req: { user } }): AccessResult => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }
    if (checkRole(['editor'], user)) {
      //check if user is editor for current bookg (chapter)
      if (user.bookAccess) {
        //building where clause for bookAccess
        const query: Where = {
          book: {
            in:
              user?.bookAccess?.map((bookId) => {
                return typeof bookId === 'string' ? bookId : bookId.id
              }) || [],
          },
        }
        return query
      }
    }
  }
  return false
}

/**
 * DEPRECATED: This hook is no longer used in the codebase.
 * * It was used to check if the user has access to the book when creating or updating a chapter.
 * it has been replaced by the chapterAccessValidation function.
 * * Validation is now handled in the field validation, not in the beforeHook.
 */
const checkChapterAccessHook: FieldHook<BookChapter> = ({ data, req }) => {
  const bookId = typeof data?.book === 'string' ? data.book : data?.book?.id
  if (!bookId) {
    throw new ValidationError({
      errors: [
        {
          message: 'Book is required',
          path: 'book',
        },
      ],
    })
  }
  const isAdmin = req.user?.roles.includes('admin')
  if (isAdmin) {
    //admins can create/update chapters for any book
    return typeof data?.book === 'string' ? data.book : data?.book?.id
  }
  const isEditor = req.user?.roles.includes('editor')
  if (isEditor) {
    //check if user is editor for current book
    if (req?.user?.bookAccess) {
      //getting new bookId from data

      //check if bookId is in user's bookAccess
      const usersBookAccess = req.user.bookAccess.map((book) => {
        return typeof book === 'string' ? book : book.id
      })
      if (usersBookAccess.includes(bookId || '')) {
        //if user is editor for this book, return bookId
        return bookId
      } else {
        //if user is not editor for this book, throw validation error
        throw new ValidationError({
          errors: [
            {
              message: 'You do not have access to this book',
              path: 'book',
            },
          ],
        })
      }
    }
  }

  throw new ValidationError({
    errors: [
      {
        message: 'You do not have access to this book',
        path: 'book',
      },
    ],
  })
}

const chapterAccessValidation: RelationshipFieldSingleValidation = async (val, args) => {
  //if no value is provided, return relationship validation
  if (!val) {
    return relationship(val, args)
  }

  // get the user from args
  // we going to only validate , if user have access to book
  const {
    req: { user },
  } = args
  const t = args.req.t as TFunction<CustomTranslationsKeys>
  if (user) {
    if (checkRole(['admin'], user)) {
      // admins can access any chapter
      return relationship(val, args)
    }
    if (checkRole(['editor'], user)) {
      // editors can access only books they have access to
      if (user.bookAccess) {
        const bookId =
          typeof val === 'string'
            ? val
            : typeof val === 'number'
              ? val.toString()
              : val?.value.toString()
        if (
          bookId &&
          user.bookAccess.some((book) =>
            typeof book === 'string' ? book === bookId : book.id === bookId,
          )
        ) {
          return relationship(val, args)
        } else {
          return t('books:noAccessToBook')
        }
      }
    }
  }

  // reuse built-in relationship validation
  return relationship(val, args)
}

const baseListFilterBooks: BaseListFilter = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return {}
  }
  // Show only books that user has access to
  if (req.user) {
    const userAccess = req.user?.bookAccess || []
    const userBookIds = userAccess.map((access) =>
      typeof access === 'string' ? access : access.id,
    )

    const query: Where = {
      id: {
        in: userBookIds,
      },
    }
    console.log('Base list filter query:', query)
    return query
  }
  return {}
}
const baseListFilterChapters: BaseListFilter = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return {}
  }
  // Show only chapters that user has access to
  if (req.user) {
    const userAccess = req.user?.bookAccess || []
    const userBookIds = userAccess.map((access) =>
      typeof access === 'string' ? access : access.id,
    )

    const query: Where = {
      book: {
        in: userBookIds,
      },
    }
    console.log('Base list filter query:', query)
    return query
  }
  return {}
}

const bookSelectFilterOptions: FilterOptions<Book> = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return true
  }
  // Show only books that user has access to
  if (req.user) {
    const userAccess = req.user?.bookAccess || []
    const userBookIds = userAccess.map((access) =>
      typeof access === 'string' ? access : access.id,
    )
    const query: Where = {
      id: {
        in: userBookIds,
      },
    }
    return query
  }
  return true // if no user , return all books ( btw this should not happen )
}

export default adminsAndEditorsBook
export {
  adminsAndEditorsChapters,
  chapterAccessValidation,
  checkChapterAccessHook,
  baseListFilterBooks,
  baseListFilterChapters,
  bookSelectFilterOptions,
}
