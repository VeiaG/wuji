import { FieldHook } from 'payload'
import type { User } from '../../payload-types'

// ensure there is always a `user` role
// do not let non-admins change roles
export const protectRoles: FieldHook<{ id: string } & User> = ({ data, req }) => {
  const isAdmin = req.user?.roles.includes('admin')

  if (!isAdmin) {
    const rolesToSave = new Set(data?.roles || [])
    //remove admin role if it exists
    rolesToSave.delete('admin')
    // ensure at least one role is present
    if (rolesToSave.size === 0) {
      rolesToSave.add('user')
    }

    return [...rolesToSave]
  }

  const userRoles = new Set(data?.roles || [])
  userRoles.add('user')
  return [...userRoles]
}
