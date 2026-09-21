import type { Config } from 'payload'

import type { ClientConfigPluginOptions } from './types'

import { defaultAccess } from './access'
import { createClientConfigHandler } from './clientConfig'
import { createFormStateHandler } from './formState'

export type { ClientConfigAccess, ClientConfigPluginOptions } from './types'
export type { FormStateRequest } from './formState'

/**
 * Відкриває зовнішнім (мобільним) клієнтам дві речі, які адмінка має «безкоштовно»:
 *
 * - `GET  {routes.api}/client-config` — санітизований конфіг Payload + видимі сутності;
 * - `POST {routes.api}/form-state`   — серверний form state (умови, валідація, дефолти,
 *   `filterOptions`, локи), той самий `buildFormState`, що й в адмінці, але через HTTP+JSON.
 *
 * Обидва ендпоінти за замовчуванням доступні тим, кого пускає адмінка (див. `options.access`).
 */
export const clientConfigPlugin =
  (options: ClientConfigPluginOptions = {}) =>
  (config: Config): Config => {
    if (options.disabled) {
      return config
    }

    const access = options.access ?? defaultAccess

    return {
      ...config,
      endpoints: [
        ...(config.endpoints ?? []),
        {
          path: options.path ?? '/client-config',
          method: 'get',
          handler: createClientConfigHandler({ access }),
        },
        {
          path: options.formStatePath ?? '/form-state',
          method: 'post',
          handler: createFormStateHandler({ access }),
        },
      ],
    }
  }
