/**
 * Чиста логіка пошуку-заміни по тексту, спільна для серверної дії
 * `replaceInChapters`. Винесена окремо від дії, бо файл із 'use server'
 * може експортувати лише асинхронні функції — та й тестувати так простіше.
 */

// Екрануємо спецсимволи, щоб `find` в звичайному режимі трактувався буквально
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildRegex(find: string, useRegex: boolean, caseSensitive: boolean): RegExp {
  const flags = caseSensitive ? 'g' : 'gi'
  const pattern = useRegex ? find : escapeRegExp(find)
  return new RegExp(pattern, flags)
}

/** Розібрані аргументи, які String.replace передає у функцію заміни */
type MatchInfo = {
  match: string
  captures: (string | undefined)[]
  offset: number
  source: string
  groups: Record<string, string | undefined> | undefined
}

// String.replace(cb) кличе колбек як (match, p1…pN, offset, source[, groups]),
// причому groups додається лише за наявності іменованих груп у патерні.
function parseReplaceArgs(args: unknown[]): MatchInfo {
  const last = args[args.length - 1]
  const hasGroups = typeof last === 'object' && last !== null
  const tail = hasGroups ? 3 : 2

  return {
    match: args[0] as string,
    captures: args.slice(1, args.length - tail) as (string | undefined)[],
    offset: args[args.length - tail] as number,
    source: args[args.length - tail + 1] as string,
    groups: hasGroups ? (last as Record<string, string | undefined>) : undefined,
  }
}

// Рушій розкриває $&, $1, $<name> тощо лише для рядкового варіанта
// String.replace. Нам потрібен колбек (щоб знати сам збіг), тому шаблон
// заміни в режимі регулярного виразу розкриваємо самі.
function expandTemplate(template: string, info: MatchInfo): string {
  return template.replace(
    /\$(\$|&|`|'|<([^>]*)>|\d{1,2})/g,
    (token: string, key: string, groupName?: string) => {
      if (key === '$') return '$'
      if (key === '&') return info.match
      if (key === '`') return info.source.slice(0, info.offset)
      if (key === "'") return info.source.slice(info.offset + info.match.length)
      // Без іменованих груп у патерні `$<…>` лишається звичайним текстом
      if (groupName !== undefined) {
        return info.groups ? (info.groups[groupName] ?? '') : token
      }

      const index = Number(key)
      if (index >= 1 && index <= info.captures.length) {
        return info.captures[index - 1] ?? ''
      }
      // $12 при меншій кількості груп — це група $1 і символ «2»
      if (key.length === 2) {
        const single = Number(key[0])
        if (single >= 1 && single <= info.captures.length) {
          return (info.captures[single - 1] ?? '') + key[1]
        }
      }
      return token
    },
  )
}

const LETTER = /\p{L}/u

/**
 * Підлаштовує регістр заміни під знайдений текст:
 * «слово» → «заміна», «СЛОВО» → «ЗАМІНА», «Слово» → «Заміна».
 * Змішаний регістр («сЛоВо») і текст без літер лишають заміну як є.
 */
export function applyMatchCase(matched: string, replacement: string): string {
  // Немає символів, у яких взагалі є регістр (цифри, розділові, ієрогліфи)
  if (matched.toLowerCase() === matched.toUpperCase()) return replacement
  if (!LETTER.test(matched)) return replacement

  const letters = matched.match(/\p{L}/gu) ?? []

  // Одну велику літеру трактуємо як початок слова, а не як CAPS
  if (letters.length > 1 && matched === matched.toUpperCase()) {
    return replacement.toUpperCase()
  }
  if (matched === matched.toLowerCase()) {
    return replacement.toLowerCase()
  }

  const firstLetter = letters[0]
  if (firstLetter && firstLetter === firstLetter.toUpperCase()) {
    return replacement.replace(LETTER, (letter) => letter.toUpperCase())
  }

  return replacement
}

export type ReplaceOutcome = {
  text: string
  count: number
  /** позиція першого збігу у вихідному тексті (-1, якщо збігів немає) */
  firstIndex: number
  firstMatchLength: number
  /** довжина того, чим замінено перший збіг — вона різна при збереженні регістру */
  firstReplacementLength: number
}

/**
 * Замінює всі збіги `regex` і принагідно збирає дані для попереднього перегляду
 * першого збігу. Використовує функційний варіант String.replace, тому в
 * буквальному режимі `template` підставляється дослівно (без спецпослідовностей
 * на кшталт `$&`), а в режимі регулярного виразу розкривається вручну.
 */
export function replaceAll(
  source: string,
  regex: RegExp,
  template: string,
  options: { useRegex: boolean; preserveCase: boolean },
): ReplaceOutcome {
  let count = 0
  let firstIndex = -1
  let firstMatchLength = 0
  let firstReplacementLength = 0

  regex.lastIndex = 0
  const text = source.replace(regex, (...args: unknown[]) => {
    const info = parseReplaceArgs(args)
    const expanded = options.useRegex ? expandTemplate(template, info) : template
    const result = options.preserveCase ? applyMatchCase(info.match, expanded) : expanded

    if (count === 0) {
      firstIndex = info.offset
      firstMatchLength = info.match.length
      firstReplacementLength = result.length
    }
    count += 1

    return result
  })

  return { text, count, firstIndex, firstMatchLength, firstReplacementLength }
}

/** Фрагмент тексту навколо збігу — для попереднього перегляду */
export function makeSnippet(text: string, index: number, length: number): string {
  if (index < 0) return text.slice(0, 120)
  const start = Math.max(0, index - 60)
  const end = Math.min(text.length, index + length + 60)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}
