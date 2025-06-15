import { User } from '@/payload-types'

export const rest = async (
  url: string,
  args?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  options?: RequestInit,
): Promise<null | undefined | User> => {
  const method = options?.method || 'POST'

  try {
    const res = await fetch(url, {
      method,
      ...(method === 'POST' ? { body: JSON.stringify(args) } : {}),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const { errors, user } = await res.json()

    if (errors) {
      throw new Error(errors[0].message)
    }

    if (res.ok) {
      return user
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw e // просто перекидаєш далі без змін
    } else if (typeof e === 'string') {
      throw new Error(e)
    } else {
      throw new Error('Невідома помилка')
    }
  }
}
