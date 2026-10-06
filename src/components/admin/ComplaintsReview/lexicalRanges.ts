import {
  $createRangeSelection,
  $getRoot,
  $isElementNode,
  $isTextNode,
  $setSelection,
  type LexicalEditor,
  type LexicalNode,
} from '@payloadcms/richtext-lexical/lexical'

/*
 * Зсуви скарг рахує фронтенд (text-selection-popup): сума довжин DOM-текстів
 * відрендереного розділу. Це збігається з сумою довжин текстових вузлів lexical
 * по порядку (таби = 1, переноси рядка й межі абзаців = 0).
 */

type Segment = { key: string; start: number; end: number }
export type TextIndex = { text: string; segments: Segment[] }
export type TextPoint = { key: string; offset: number }
export type FoundRange = { start: number; end: number; exact: boolean }

// Викликати всередині editor.read / editor.update
export function $buildTextIndex(): TextIndex {
  const segments: Segment[] = []
  let text = ''
  const walk = (node: LexicalNode) => {
    if ($isTextNode(node)) {
      const content = node.getTextContent()
      segments.push({ key: node.getKey(), start: text.length, end: text.length + content.length })
      text += content
    } else if ($isElementNode(node)) {
      node.getChildren().forEach(walk)
    }
  }
  walk($getRoot())
  return { text, segments }
}

const squash = (s: string) => s.replace(/\s+/g, '')

/**
 * Шукає виділений фрагмент: спершу за збереженими зсувами, а якщо розділ
 * відтоді змінювали — найближче входження тексту (без урахування пробілів).
 */
export function findFragment(
  index: TextIndex,
  selectedText: string,
  position?: { start?: number | null; end?: number | null } | null,
): FoundRange | null {
  const needle = squash(selectedText)
  if (!needle) return null

  const start = position?.start ?? null
  const end = position?.end ?? null
  if (start !== null && end !== null && end > start && end <= index.text.length) {
    if (squash(index.text.slice(start, end)) === needle) return { start, end, exact: true }
  }

  // Стиснутий текст + мапа на оригінальні індекси
  const map: number[] = []
  let squashed = ''
  for (let i = 0; i < index.text.length; i++) {
    if (!/\s/.test(index.text[i])) {
      map.push(i)
      squashed += index.text[i]
    }
  }

  let best: FoundRange | null = null
  let bestDistance = Infinity
  for (let at = squashed.indexOf(needle); at !== -1; at = squashed.indexOf(needle, at + 1)) {
    const s = map[at]
    const e = map[at + needle.length - 1] + 1
    const distance = Math.abs(s - (start ?? 0))
    if (distance < bestDistance) {
      best = { start: s, end: e, exact: false }
      bestDistance = distance
    }
  }
  return best
}

export function toPoint(index: TextIndex, offset: number, side: 'start' | 'end'): TextPoint | null {
  // Для початку беремо сегмент, де offset < end; для кінця — де offset > start
  for (const seg of index.segments) {
    if (side === 'start' ? offset >= seg.start && offset < seg.end : offset > seg.start && offset <= seg.end) {
      return { key: seg.key, offset: offset - seg.start }
    }
  }
  return null
}

/** DOM Range для CSS Custom Highlight API */
export function toDomRange(editor: LexicalEditor, index: TextIndex, range: FoundRange): Range | null {
  const a = toPoint(index, range.start, 'start')
  const b = toPoint(index, range.end, 'end')
  if (!a || !b) return null
  const startNode = firstTextNode(editor.getElementByKey(a.key))
  const endNode = firstTextNode(editor.getElementByKey(b.key))
  if (!startNode || !endNode) return null
  const dom = document.createRange()
  dom.setStart(startNode, Math.min(a.offset, startNode.length))
  dom.setEnd(endNode, Math.min(b.offset, endNode.length))
  return dom
}

function firstTextNode(el: HTMLElement | null): Text | null {
  if (!el) return null
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  return walker.nextNode() as Text | null
}

/**
 * Замінює фрагмент [start, end) текстом replacement через selection —
 * lexical сам розбирається з форматуванням і кількома вузлами.
 * При видаленні прибирає зайвий пробіл, щоб не лишалось «слово  слово» чи «слово ,».
 */
export function replaceFragment(editor: LexicalEditor, selectedText: string, position: FoundRange, replacement: string) {
  let applied = false
  editor.update(() => {
    const index = $buildTextIndex()
    const found = findFragment(index, selectedText, position)
    if (!found) return
    let { start, end } = found
    if (!replacement) {
      const before = index.text[start - 1]
      const after = index.text[end]
      if (before === ' ' && (after === ' ' || after === undefined || /[.,!?;:…»)]/.test(after))) start -= 1
      else if (after === ' ' && (before === undefined || /[\n«(]/.test(before))) end += 1
    }
    const a = toPoint(index, start, 'start')
    const b = toPoint(index, end, 'end')
    if (!a || !b) return
    const selection = $createRangeSelection()
    selection.anchor.set(a.key, a.offset, 'text')
    selection.focus.set(b.key, b.offset, 'text')
    $setSelection(selection)
    selection.insertText(replacement)
    $setSelection(null)
    applied = true
  })
  return applied
}

/** Прокрутити до першого підсвіченого фрагмента (підсвітка — глобальна, тож працює звідусіль) */
export function scrollToHighlight(name: string) {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return false
  const range = [...(CSS.highlights.get(name) ?? [])][0] as Range | undefined
  const el = range?.startContainer.parentElement
  if (!el) return false
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  return true
}
