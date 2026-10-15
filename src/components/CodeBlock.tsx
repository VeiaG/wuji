'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ThemedToken } from 'shiki/core'

import { codeLanguages } from '@/lib/code-languages'
import { highlightCode } from '@/lib/shiki'
import { cn } from '@/lib/utils'

type Props = {
  code?: string | null
  language?: string | null
  className?: string
}

// Курсив/жирний у токенах shiki — бітова маска FontStyle
const fontStyleClass = (fontStyle?: number) =>
  cn(fontStyle && fontStyle & 1 && 'italic', fontStyle && fontStyle & 2 && 'font-bold')

export default function CodeBlock({ code, language, className }: Props) {
  const source = (code ?? '').replace(/\n$/, '')
  const lang = language ?? 'plaintext'
  const [tokens, setTokens] = useState<ThemedToken[][] | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    highlightCode(source, lang)
      .then((result) => {
        if (!cancelled) setTokens(result)
      })
      .catch(() => {
        // Без підсвітки код лишається читабельним як звичайний текст
      })
    return () => {
      cancelled = true
    }
  }, [source, lang])

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
    } catch {
      // Буфер обміну недоступний (http, заборона браузера) — нічого не робимо
    }
  }

  const label = codeLanguages[lang as keyof typeof codeLanguages] ?? lang

  return (
    <figure className={cn('not-prose my-6 overflow-hidden rounded-tile-sm bg-background', className)}>
      <figcaption className="flex items-center justify-between gap-3 py-1.5 pr-1.5 pl-4">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-chip hover:text-foreground"
          aria-label={copied ? 'Скопійовано' : 'Скопіювати код'}
        >
          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
        </button>
      </figcaption>
      <pre className="overflow-x-auto px-4 pb-4 font-mono text-[13.5px] leading-relaxed text-soft md:text-[14px]">
        <code>
          {tokens
            ? tokens.map((line, i) => (
                <span key={i} className="block min-h-[1lh]">
                  {line.map((token, j) => (
                    <span key={j} style={{ color: token.color }} className={fontStyleClass(token.fontStyle)}>
                      {token.content}
                    </span>
                  ))}
                </span>
              ))
            : source}
        </code>
      </pre>
    </figure>
  )
}
