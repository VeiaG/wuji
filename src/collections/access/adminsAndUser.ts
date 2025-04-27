import { Access, AccessResult, FieldAccess } from 'payload'
import { checkRole } from './checkRole'

const adminsAndUser: Access = ({ req: { user } }): AccessResult => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }
    return {
      id: {
        equals: user.id,
      },
    }
  }

  return false
}

const adminsAndUserFieldAccess: FieldAccess = ({ req: { user }, doc }) => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }
    return user.id === doc.id
  }
  return false
}
export { adminsAndUserFieldAccess }
export default adminsAndUser
