import React from 'react'

/**
 * Простий парсер markdown для bold та italic
 * Підтримує тільки ** (bold) та * (italic)
 * Обробляє вкладені теги рекурсивно
 *
 * @example
 * parseSimpleMarkdown("Це **жирний** та *курсив*")
 * // Повертає: ["Це ", <strong>жирний</strong>, " та ", <em>курсив</em>]
 */
export function parseSimpleMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Спочатку шукаємо ** (bold) - важливо перевіряти перед *
    const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*/)
    if (boldMatch) {
      // Додаємо текст до bold
      if (boldMatch[1]) {
        parts.push(boldMatch[1])
      }
      // Додаємо bold з рекурсивним парсингом вмісту для вкладених italic
      parts.push(<strong key={`bold-${key++}`}>{parseSimpleMarkdown(boldMatch[2])}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Потім шукаємо * (italic)
    const italicMatch = remaining.match(/^(.*?)\*(.*?)\*/)
    if (italicMatch) {
      // Додаємо текст до italic
      if (italicMatch[1]) {
        parts.push(italicMatch[1])
      }
      // Додаємо italic (без рекурсії для вмісту, щоб уникнути infinite loop)
      parts.push(<em key={`italic-${key++}`}>{italicMatch[2]}</em>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Якщо не знайшли жодного паттерну, додаємо весь решту тексту
    parts.push(remaining)
    break
  }

  return parts
}
