/**
 * Formats a date into Ukrainian relative time string
 * e.g. "5 хвилин тому", "годину тому", "2 дні тому"
 */
export function formatTimeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) {
    return 'щойно'
  } else if (diffMin < 60) {
    if (diffMin === 1) return 'хвилину тому'
    if (diffMin < 5) return `${diffMin} хвилини тому`
    return `${diffMin} хвилин тому`
  } else if (diffHour < 24) {
    if (diffHour === 1) return 'годину тому'
    if (diffHour < 5) return `${diffHour} години тому`
    return `${diffHour} годин тому`
  } else if (diffDay < 7) {
    if (diffDay === 1) return 'день тому'
    if (diffDay < 5) return `${diffDay} дні тому`
    return `${diffDay} днів тому`
  } else if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7)
    if (weeks === 1) return 'тиждень тому'
    if (weeks < 5) return `${weeks} тижні тому`
    return `${weeks} тижнів тому`
  } else {
    const months = Math.floor(diffDay / 30)
    if (months === 1) return 'місяць тому'
    if (months < 5) return `${months} місяці тому`
    return `${months} місяців тому`
  }
}
