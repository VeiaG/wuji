import { Access, AccessResult } from 'payload'
import { checkRole } from './checkRole'

const adminsAndUserOrPublic = (field: string): Access => {
  return ({ req: { user } }): AccessResult => {
    if (user) {
      if (checkRole(['admin'], user)) {
        return true
      }
      return {
        or: [
          {
            [`${field}`]: {
              equals: user.id,
            },
          },
          {
            [`${field}.isPublic`]: {
              equals: true,
            },
          },
        ],
      }
    }

    return {
      [`${field}.isPublic`]: {
        equals: true,
      },
    }
  }
}

export default adminsAndUserOrPublic
