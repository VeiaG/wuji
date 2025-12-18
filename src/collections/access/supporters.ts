import { Access, FieldAccess } from 'payload'
import { checkRole } from './checkRole'

//Any Editor and Supporter and Admins have access
export const supporters: Access = ({ req: { user } }) =>
  checkRole(['admin', 'supporter', 'editor'], user)

export const supportersFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) {
    return checkRole(['admin', 'supporter', 'editor'], user)
  }
  return false
}
