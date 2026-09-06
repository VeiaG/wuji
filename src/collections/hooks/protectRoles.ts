import { FieldHook } from 'payload'
import type { User } from '../../payload-types'

type Role = User['roles'][number]

// Ролі, які може видати лише адміністратор.
const PRIVILEGED_ROLES: Role[] = ['admin', 'editor', 'writer', 'supporter']

// Гарантує наявність ролі `user` і не дозволяє їй бути єдиною зміною.
const withUserRole = (roles: Role[]): Role[] => {
  const result = new Set<Role>(roles)
  result.add('user')
  return [...result]
}

/**
 * Захист поля `roles`:
 * 1. роль `user` є завжди;
 * 2. часткове оновлення, у якому `roles` взагалі немає (наприклад, службовий
 *    запис сесії при вході через Google), НЕ перезаписує збережені ролі —
 *    інакше адмін після кожного логіну ставав звичайним користувачем;
 * 3. підвищити або змінити ролі може лише адміністратор.
 */
export const protectRoles: FieldHook<{ id: string } & User> = ({
  data,
  operation,
  originalDoc,
  req,
  value,
}) => {
  const isAdmin = Boolean(req.user?.roles?.includes('admin'))
  const existingRoles = (originalDoc?.roles ?? []) as Role[]

  // Поле відсутнє в payload-і запиту: або це часткове оновлення, або доступ до
  // поля зняв beforeValidate. Залишаємо те, що вже збережено в документі.
  const incoming = (value ?? data?.roles) as Role[] | undefined
  if (!incoming) {
    return operation === 'update' ? withUserRole(existingRoles) : withUserRole([])
  }

  if (isAdmin) {
    return withUserRole(incoming)
  }

  // Не адміністратор: наявні ролі документа лишаються незмінними,
  // а при створенні акаунта привілейовані ролі відкидаються.
  if (operation === 'update') {
    return withUserRole(existingRoles)
  }

  return withUserRole(incoming.filter((role) => !PRIVILEGED_ROLES.includes(role)))
}
