import { Access, FieldAccess } from 'payload'
import { checkRole } from './checkRole'

export const admins: Access = ({ req: { user } }) => checkRole(['admin'], user)

export const adminsFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) {
    return checkRole(['admin'], user)
  }
  return false
}
