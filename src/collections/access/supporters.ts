import { Access, AccessResult, FieldAccess } from 'payload'
import { checkRole } from './checkRole'
import { User } from '@/payload-types'

//Any Editor and Supporter and Admins have access
export const supporters: Access = ({ req: { user } }) =>
  checkRole(['admin', 'supporter', 'editor'], user)

export const supportersFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) {
    return checkRole(['admin', 'supporter', 'editor'], user)
  }
  return false
}

/**
 * Field access function to allow only Supporters, Editors, and Admins to access items where the specified field matches their user ID
 *
 * Used for avatar and banner fields in Users collection, so Supporters and Editors can only edit their own avatars and banners, while Admins can edit all.
 * Regular users have no access to these fields. (This is neccessary, to prevent regular users from using existing avatars from any supporter/editor)
 *
 * One caveat - Supporters and editors can set their avatar/banner to upload that not belong to them, but that's acceptable for now. (don't know any easy way to prevent that at the moment)
 *
 * We have owner field in user-uploads collection, but using that would complicate the logic too much for now.
 * At least they can't change avatar/banner of other supporters/editors, so it's acceptable.
 */
export const supportersAndUserByField = (field: string): FieldAccess => {
  return ({ req: { user }, doc, id }) => {
    if (user) {
      if (checkRole(['admin'], user)) {
        return true //Admins have full access to everything
      }
      //Only Supporters and Editors have access to this collection plus Admins
      if (!checkRole(['supporter', 'editor'], user)) {
        return false
      }
      if (field === 'id') {
        return id === user.id
      }
      return doc?.[field] === user.id
    }

    return false
  }
}

/**
 * Client function to check if the user has supporter access
 */
export const isAllowedSupporter = (user: User | null | undefined): boolean => {
  if (user) {
    return checkRole(['admin', 'supporter', 'editor'], user)
  }
  return false
}
