// Позначка в localStorage, що в цьому браузері людина була залогінена. Потрібна,
// щоб помітити сесію, яка закінчилась сама: кука живе рівно стільки, скільки
// токен, тож після довгої перерви браузер її вже видалив і сервер нічого не бачить.
const KEY = 'had-session'

export const markSession = () => {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // localStorage недоступний — просто без позначки
  }
}

// Повертає, чи була позначка, і знімає її.
export const takeSessionMark = (): boolean => {
  try {
    const had = localStorage.getItem(KEY) === '1'
    localStorage.removeItem(KEY)
    return had
  } catch {
    return false
  }
}

export const clearSessionMark = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
