import type {
  BuildFormStateArgs,
  Collection,
  Data,
  DocumentPreferences,
  FormState,
  PayloadHandler,
  PayloadRequest,
  Row,
  SanitizedDocumentPermissions,
} from 'payload'

import { docAccessOperation, docAccessOperationGlobal } from 'payload'

import type { ClientConfigAccess } from './types'

import { denyResponse } from './access'

/** Тіло POST-запиту. Дзеркалить аргументи `buildFormState`, які має сенс віддавати клієнту. */
export type FormStateRequest = {
  /** Перевірка, чи документ не змінили в іншій вкладці/пристрої. Разом з `originalUpdatedAt`. */
  checkForStaleData?: boolean
  collectionSlug?: string
  /** Дані документа. Якщо не передані — беруться з `formState` (`reduceFieldsToValues`). */
  data?: Data
  /** Преференції документа (згорнуті групи, активні таби). Мобілці зазвичай не потрібні. */
  docPreferences?: DocumentPreferences
  /** Стейт батьківської форми — потрібен для підформ, де `condition` дивиться на весь документ. */
  documentFormState?: FormState
  /** Поточний стейт форми з клієнта. Немає на першому запиті (відкриття документа). */
  formState?: FormState
  globalSlug?: string
  id?: number | string
  /** Початкові дані блоку — для окремого екрана редагування одного блоку. */
  initialBlockData?: Data
  initialBlockFormState?: FormState
  operation?: 'create' | 'update'
  /** `updatedAt` на момент відкриття документа. */
  originalUpdatedAt?: string
  readOnly?: boolean
  /** Повернути стан локу документа (хто зараз редагує). */
  returnLockStatus?: boolean
  /** Шлях у schema map. За замовчуванням — сам slug. Інше значення лише для підформ. */
  schemaPath?: string
  /** `true` до першої спроби сабміту, `false` після неї (як `skipValidation: !submitted` в адмінці). */
  skipValidation?: boolean
  /** Продовжити лок документа за поточним користувачем. */
  updateLastEdited?: boolean
}

const badRequest = (message: string): Response => Response.json({ message }, { status: 400 })

/**
 * Прибирає з відповіді те, що не серіалізується або не потрібне зовнішньому клієнту:
 * `customComponents` (з `mockRSCs: true` там рядки-заглушки), `fieldSchema`,
 * `validate` (функція), `lastRenderedPath` (потрібен лише рендеру адмінки).
 */
const stripServerOnlyKeys = (state: FormState): FormState => {
  const result: FormState = {}

  for (const path in state) {
    const {
      customComponents: _customComponents,
      fieldSchema: _fieldSchema,
      lastRenderedPath: _lastRenderedPath,
      validate: _validate,
      ...rest
    } = state[path]

    result[path] = Array.isArray(rest.rows)
      ? {
          ...rest,
          rows: rest.rows.map(
            ({
              customComponents: _rowComponents,
              lastRenderedPath: _rowRenderedPath,
              ...row
            }): Row => row,
          ),
        }
      : rest
  }

  return result
}

/**
 * Серверний form state для зовнішніх (не-React) клієнтів.
 *
 * В адмінці це робить server action `form-state` з `handleServerFunctions`, який говорить
 * RSC flight-протоколом — мобільний клієнт з ним не працює. Тут той самий `buildFormState`,
 * але через звичайний HTTP+JSON і з `mockRSCs: true`, щоб у відповіді не було React-нод.
 *
 * Що дає (і що інакше довелось би реімплементувати на клієнті):
 * `admin.condition` → `passesCondition`, `field.validate` → `valid`/`errorMessage`,
 * функціональні `defaultValue`, `filterOptions` для relationship/select/blocks, локи документа.
 *
 * Це НЕ заміна серверної валідації: на сейві Payload у будь-якому разі проганяє
 * `condition` і `validate` у `beforeChange`. Ендпоінт потрібен для інтерактивності до сабміту.
 *
 * Локаль береться зі звичайного `?locale=` на запиті (як і в решті REST API).
 */
export const createFormStateHandler =
  ({ access }: { access: ClientConfigAccess }): PayloadHandler =>
  async (req: PayloadRequest) => {
    if (!(await access(req))) {
      return denyResponse(req)
    }

    if (typeof req.json !== 'function') {
      return badRequest('Expected a JSON body')
    }

    let body: FormStateRequest

    try {
      body = (await req.json()) as FormStateRequest
    } catch {
      return badRequest('Could not parse JSON body')
    }

    const {
      id,
      checkForStaleData,
      collectionSlug,
      data,
      docPreferences,
      documentFormState,
      formState,
      globalSlug,
      initialBlockData,
      initialBlockFormState,
      // Глобали завжди 'update' — окремого документа для створення в них немає.
      operation = globalSlug || id ? 'update' : 'create',
      originalUpdatedAt,
      readOnly,
      returnLockStatus,
      schemaPath,
      skipValidation = true,
      updateLastEdited,
    } = body

    if (!collectionSlug && !globalSlug) {
      return badRequest('Either collectionSlug or globalSlug must be provided')
    }

    if (collectionSlug && globalSlug) {
      return badRequest('Provide either collectionSlug or globalSlug, not both')
    }

    let docPermissions: SanitizedDocumentPermissions

    if (collectionSlug) {
      // `payload.collections` типізований згенерованими слагами, а сюди приходить рядок.
      const collection = (req.payload.collections as Record<string, Collection | undefined>)[
        collectionSlug
      ]

      if (!collection) {
        return Response.json({ message: `Unknown collection: ${collectionSlug}` }, { status: 404 })
      }

      // Те саме, що адмінка бере з GET /api/{collection}/access/{id}.
      docPermissions = await docAccessOperation({ id, collection, req })
    } else {
      const globalConfig = req.payload.config.globals.find(({ slug }) => slug === globalSlug)

      if (!globalConfig) {
        return Response.json({ message: `Unknown global: ${globalSlug}` }, { status: 404 })
      }

      docPermissions = await docAccessOperationGlobal({ globalConfig, req })
    }

    // Динамічний імпорт: `@payloadcms/ui` тягне React-компоненти зі стилями, а `payload.config.ts`
    // вантажиться ще й CLI (`payload generate:types`, `migrate`) через tsx, який `.scss` не розуміє.
    const { buildFormState } = await import('@payloadcms/ui/utilities/buildFormState')

    const args = {
      id,
      checkForStaleData,
      collectionSlug,
      data,
      docPermissions,
      docPreferences: docPreferences ?? { fields: {} },
      documentFormState,
      formState,
      globalSlug,
      initialBlockData,
      initialBlockFormState,
      // Без цього у відповідь потраплять справжні React-ноди, які не серіалізуються.
      mockRSCs: true,
      operation,
      originalUpdatedAt,
      readOnly,
      // Рендер і так заглушка через `mockRSCs`, але з `false` сервер робить менше роботи.
      renderAllFields: false,
      req,
      returnLockStatus,
      schemaPath: schemaPath ?? collectionSlug ?? globalSlug!,
      skipValidation,
      updateLastEdited,
    } as BuildFormStateArgs

    try {
      const { lockedState, staleDataState, state } = await buildFormState(args)

      return Response.json({
        lockedState,
        staleDataState,
        state: stripServerOnlyKeys(state),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'There was an error building form state'

      req.payload.logger.error({ err, msg: 'form-state endpoint failed' })

      // Невідомий `schemaPath` — це помилка клієнта, а не сервера.
      if (
        message.includes('fieldSchemaMap') ||
        message.includes('does not contain any subfields')
      ) {
        return badRequest(message)
      }

      return Response.json({ message }, { status: 500 })
    }
  }
