import type { PayloadRequest } from 'payload'

/**
 * Перевірка доступу до ендпоінтів плагіна.
 * Повертає `true`, якщо користувачу можна віддавати конфіг / form state.
 */
export type ClientConfigAccess = (req: PayloadRequest) => boolean | Promise<boolean>

export type ClientConfigPluginOptions = {
  /**
   * Хто має доступ до ендпоінтів плагіна.
   * За замовчуванням — ті самі користувачі, яких пускає адмінка (`canAccessAdmin`,
   * тобто `access.admin` колекції з `admin.user`).
   *
   * Якщо мобільному клієнту треба віддавати конфіг усім залогіненим:
   * `access: (req) => Boolean(req.user)`
   */
  access?: ClientConfigAccess
  /**
   * Вимкнути плагін, не прибираючи його з масиву `plugins`.
   * @default false
   */
  disabled?: boolean
  /**
   * Шлях ендпоінта form state відносно `routes.api` (за замовчуванням `/api`).
   * @default '/form-state'
   */
  formStatePath?: string
  /**
   * Шлях ендпоінта конфігу відносно `routes.api` (за замовчуванням `/api`).
   * @default '/client-config'
   */
  path?: string
}
