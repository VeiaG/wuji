/**
 * Витягує id зі значення relationship-поля.
 *
 * Payload віддає такі поля або як id, або як вже підтягнутий документ —
 * залежно від `depth` конкретної операції. Скрізь, де id треба порівняти
 * чи записати назад, зручніше мати одне нормалізоване значення.
 */
export const relationId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'id' in (value as { id?: unknown })) {
    const { id } = value as { id?: unknown }
    return id ? String(id) : null
  }
  return null
}
