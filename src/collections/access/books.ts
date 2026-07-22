import {
  Access,
  AccessResult,
  BaseListFilter,
  FieldAccess,
  FilterOptions,
  RelationshipFieldSingleValidation,
  ValidationError,
  Where,
} from 'payload'
import { checkRole } from './checkRole'
import { Book, BookChapter, User } from '@/payload-types'
import { FieldHook } from 'payload'
import { relationship } from 'payload/shared'
import { TFunction } from '@payloadcms/translations'
import { CustomTranslationsKeys } from '@/translations'

const getBookAccessIds = (user: User): string[] =>
  user.bookAccess?.map((bookId) => {
    return typeof bookId === 'string' ? bookId : bookId.id
  }) || []

//admins can create any book, writers can create their own (ownership is forced by a beforeValidate hook)
const adminsAndWriters: Access = ({ req: { user } }) => checkRole(['admin', 'writer'], user)

const adminsAndEditorsBook: Access<Book> = ({ req: { user } }): AccessResult => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }
    const or: Where[] = []
    if (checkRole(['editor'], user) && user.bookAccess) {
      //editors can update books they have access to
      or.push({
        id: {
          in: getBookAccessIds(user),
        },
      })
    }
    if (checkRole(['writer'], user)) {
      //writers can update their own books
      or.push({
        owner: {
          equals: user.id,
        },
      })
    }
    if (or.length > 0) {
      return { or }
    }
  }
  return false
}
//writers can delete their own books, editors cannot delete at all
const adminsAndWritersDeleteBook: Access<Book> = ({ req: { user } }): AccessResult => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }
    if (checkRole(['writer'], user)) {
      return {
        owner: {
          equals: user.id,
        },
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
    const or: Where[] = []
    if (checkRole(['editor'], user) && user.bookAccess) {
      //editors can manage chapters of books they have access to
      or.push({
        book: {
          in: getBookAccessIds(user),
        },
      })
    }
    if (checkRole(['writer'], user)) {
      //writers can manage chapters of their own books
      or.push({
        'book.owner': {
          equals: user.id,
        },
      })
    }
    if (or.length > 0) {
      return { or }
    }
  }
  return false
}
//writers can delete chapters of their own books, editors cannot delete at all
const adminsAndWritersDeleteChapters: Access<BookChapter> = ({ req: { user } }): AccessResult => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }
    if (checkRole(['writer'], user)) {
      return {
        'book.owner': {
          equals: user.id,
        },
      }
    }
  }
  return false
}
const extractRelId = (rel: unknown): string | number | null => {
  if (rel === null || rel === undefined) return null
  return typeof rel === 'object' ? (rel as { id: string | number }).id : (rel as string | number)
}

//Whether the current writer may edit this field on the book.
//Discriminate create vs update by the presence of a real document id — Payload passes an
//empty `doc` ({}) on the create form, so we must not rely on `doc` being falsy.
//- create (no id yet): a writer can only create their own originals (owner is forced to
//  them by forceWriterOwnership, origin constrained by validateOriginChange on save), so
//  allow — this keeps required fields (cover, genres) editable on the new book.
//- update: only on their own book (compare against the persisted owner).
const writerOwnsBookField = (
  user: User,
  { id, doc }: { id?: string | number; doc?: Partial<Book> },
): boolean => {
  const docId = id ?? doc?.id
  if (!docId) return true
  const ownerId = extractRelId(doc?.owner)
  return ownerId !== null && String(ownerId) === String(user.id)
}

//field access for fields that writers may edit on their own books (e.g. cover),
//while editors are still restricted to admins-only behaviour
const adminsOrBookOwnerFieldAccess: FieldAccess = (args) => {
  const {
    req: { user },
  } = args
  if (!user) return false
  if (checkRole(['admin'], user)) return true
  if (checkRole(['writer'], user)) return writerOwnsBookField(user, args)
  return false
}

//field access for fields editable both by writers (own books) and editors (books in
//their bookAccess) — e.g. genres. Cover intentionally does NOT use this: editors must
//not change the cover of a translation.
const adminsEditorsOrBookOwnerFieldAccess: FieldAccess = (args) => {
  const {
    req: { user },
    id,
    doc,
  } = args
  if (!user) return false
  if (checkRole(['admin'], user)) return true
  //writers may edit their own books; fall through so dual-role writer+editor users are
  //still authorized for books in their editor bookAccess that they don't personally own
  if (checkRole(['writer'], user) && writerOwnsBookField(user, args)) return true
  if (checkRole(['editor'], user)) {
    //editors can only edit books they have explicit access to; no create for editors
    const bookId = id ?? (doc as { id?: string | number } | undefined)?.id
    if (bookId === null || bookId === undefined) return false
    return getBookAccessIds(user).includes(String(bookId))
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
    const bookId =
      typeof val === 'string'
        ? val
        : typeof val === 'number'
          ? val.toString()
          : val?.value.toString()
    if (bookId && checkRole(['editor', 'writer'], user)) {
      // editors can access only books they have access to
      if (
        checkRole(['editor'], user) &&
        user.bookAccess?.some((book) =>
          typeof book === 'string' ? book === bookId : book.id === bookId,
        )
      ) {
        return relationship(val, args)
      }
      // writers can access only their own books
      if (checkRole(['writer'], user)) {
        const book = await args.req.payload
          .findByID({ collection: 'books', id: bookId, depth: 0 })
          .catch(() => null)
        const ownerId =
          book && (typeof book.owner === 'object' && book.owner !== null
            ? book.owner.id
            : book.owner)
        if (ownerId && ownerId === user.id) {
          return relationship(val, args)
        }
      }
      return t('books:noAccessToBook')
    }
  }

  // reuse built-in relationship validation
  return relationship(val, args)
}

const baseListFilterBooks: BaseListFilter = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return {}
  }
  // Show only books that user has access to (editor access or own books)
  if (req.user) {
    const query: Where = {
      or: [
        {
          id: {
            in: getBookAccessIds(req.user),
          },
        },
        {
          owner: {
            equals: req.user.id,
          },
        },
      ],
    }
    return query
  }
  return {}
}
const baseListFilterChapters: BaseListFilter = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return {}
  }
  // Show only chapters that user has access to (editor access or own books)
  if (req.user) {
    const query: Where = {
      or: [
        {
          book: {
            in: getBookAccessIds(req.user),
          },
        },
        {
          'book.owner': {
            equals: req.user.id,
          },
        },
      ],
    }
    return query
  }
  return {}
}

const bookSelectFilterOptions: FilterOptions<Book> = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return true
  }
  // Show only books that user has access to (editor access or own books)
  if (req.user) {
    const query: Where = {
      or: [
        {
          id: {
            in: getBookAccessIds(req.user),
          },
        },
        {
          owner: {
            equals: req.user.id,
          },
        },
      ],
    }
    return query
  }
  return true // if no user , return all books ( btw this should not happen )
}

export default adminsAndEditorsBook
export {
  adminsAndWriters,
  adminsAndWritersDeleteBook,
  adminsAndEditorsChapters,
  adminsAndWritersDeleteChapters,
  adminsOrBookOwnerFieldAccess,
  adminsEditorsOrBookOwnerFieldAccess,
  chapterAccessValidation,
  checkChapterAccessHook,
  baseListFilterBooks,
  baseListFilterChapters,
  bookSelectFilterOptions,
}
