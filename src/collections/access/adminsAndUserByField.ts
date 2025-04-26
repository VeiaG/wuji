import { Access, AccessResult } from 'payload'
import { checkRole } from './checkRole'

const adminsAndUserByField = (field: string): Access => {
  return ({ req: { user } }): AccessResult => {
    if (user) {
      if (checkRole(['admin'], user)) {
        return true
      }
      return {
        [`${field}`]: {
          equals: user.id,
        },
      }
    }

    return false
  }
}

export default adminsAndUserByField
