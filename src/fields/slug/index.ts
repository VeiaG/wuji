import type { SlugField } from 'payload'

import { formatSlug } from './formatSlug'

/**
 * Нативне slug-поле Payload 4 з нашою транслітерацією (укр → лат).
 *
 * На відміну від старого кастомного поля, slug заповнюється один раз і далі сам
 * не змінюється при зміні назви (живі URL не ламаються). Перегенерувати можна
 * кнопкою в адмінці. `required: false`, бо в наявних документах (зокрема в користувачів
 * без нікнейму) slug може бути порожнім; `unique` за замовчуванням вимкнено, як і було.
 */
export const slugField = (
  useAsSlug = 'title',
  overrides: Partial<Omit<SlugField, 'type'>> = {},
): SlugField => ({
  name: 'slug',
  type: 'slug',
  label: 'Slug',
  useAsSlug,
  required: false,
  unique: false,
  slugify: ({ valueToSlugify }) => formatSlug(valueToSlugify),
  ...overrides,
})
