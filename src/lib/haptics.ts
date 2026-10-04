/**
 * Короткий тактильний відгук.
 *
 * Android / Chrome: Vibration API.
 * iOS Safari (18+): Vibration API немає, але перемикання
 * `<input type="checkbox" switch>` викликає системний haptic —
 * тож створюємо прихований switch з label і програмно клікаємо по label.
 * Це недокументована поведінка, Apple може її змінити.
 */
export function hapticTap() {
  if (typeof window === 'undefined') return

  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(10)
    return
  }

  try {
    const label = document.createElement('label')
    label.ariaHidden = 'true'
    label.style.display = 'none'

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)

    document.head.appendChild(label)
    label.click()
    document.head.removeChild(label)
  } catch {
    // haptic — не критично
  }
}
