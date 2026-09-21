import type { I18nClient } from '@payloadcms/translations'
import type { ClientConfig, PayloadHandler, PayloadRequest, VisibleEntities } from 'payload'

import { createClientConfig } from 'payload'

import type { ClientConfigAccess } from './types'

import { denyResponse } from './access'

// `hidden` типізований по-різному у колекцій (`{ user: ClientUser }`) і глобалів
// (`{ user: User | null }`), тому приймаємо `unknown` і звужуємо всередині.
const isHidden = (hidden: unknown, user: unknown): boolean => {
  if (typeof hidden === 'function') {
    try {
      return Boolean((hidden as (args: { user: unknown }) => boolean)({ user }))
    } catch {
      // Як і в адмінці: якщо резолвер впав — вважаємо сутність прихованою.
      return true
    }
  }

  return Boolean(hidden)
}

/**
 * `admin.hidden` — server-only властивість, у клієнтський конфіг вона не потрапляє.
 * Веб-адмінка рахує видимі сутності окремо (`getVisibleEntities` з `@payloadcms/ui`)
 * і передає їх у RootProvider. Повторюємо ту саму логіку, щоб зовнішній клієнт
 * будував навігацію так само, як адмінка.
 */
const getVisibleEntities = (req: PayloadRequest): VisibleEntities => ({
  collections: req.payload.config.collections
    .filter(({ admin }) => !isHidden(admin?.hidden, req.user))
    .map(({ slug }) => slug),
  globals: req.payload.config.globals
    .filter(({ admin }) => !isHidden(admin?.hidden, req.user))
    .map(({ slug }) => slug),
})

/**
 * Віддає санітизований (клієнтський) конфіг Payload — той самий об'єкт,
 * який адмінка серіалізує у браузер. Серверні властивості (`db`, `secret`,
 * `email`, `hooks`, `endpoints`, ...) відрізаються в `createClientConfig`.
 */
export const createClientConfigHandler =
  ({ access }: { access: ClientConfigAccess }): PayloadHandler =>
  async (req: PayloadRequest) => {
    if (!(await access(req))) {
      return denyResponse(req)
    }

    // Страхувальна перевірка: кастомний `access` міг пропустити аноніма, а
    // `createClientConfig` для `user: true` віддає повний конфіг без санітизації.
    if (!req.user) {
      return denyResponse(req)
    }

    const clientConfig: ClientConfig = createClientConfig({
      config: req.payload.config,
      // Серверний i18n є структурним надмножинним варіантом клієнтського.
      i18n: req.i18n as unknown as I18nClient,
      importMap: req.payload.importMap,
      user: req.user,
    })

    return Response.json({
      config: clientConfig,
      visibleEntities: getVisibleEntities(req),
    })
  }
