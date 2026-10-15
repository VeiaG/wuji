import {
  convertMarkdownToLexical,
  editorConfigFactory,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import type { RichTextField } from 'payload'
import { codeLanguages } from '@/lib/code-languages'

// Типові скорочення з ```fence → id мов блоку коду; невідомі стають plaintext,
// бо select у блоці не пропустить значення поза списком
const languageAliases: Record<string, keyof typeof codeLanguages> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  htm: 'html',
  sass: 'scss',
  jsonc: 'json',
  json5: 'json',
  yml: 'yaml',
  md: 'markdown',
  mdx: 'markdown',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  console: 'shell',
  shellscript: 'shell',
  py: 'python',
  postgres: 'sql',
  postgresql: 'sql',
  mysql: 'sql',
  golang: 'go',
  rs: 'rust',
  'c++': 'cpp',
  c: 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  'c#': 'csharp',
  gql: 'graphql',
  docker: 'dockerfile',
  svg: 'xml',
  text: 'plaintext',
  txt: 'plaintext',
  plain: 'plaintext',
}

export const normalizeCodeLanguage = (language?: null | string): keyof typeof codeLanguages => {
  const key = (language ?? '').trim().toLowerCase()
  if (key in codeLanguages) return key as keyof typeof codeLanguages
  return languageAliases[key] ?? 'plaintext'
}

type AnyNode = {
  type?: string
  fields?: { blockType?: string; language?: null | string }
  children?: AnyNode[]
}

const normalizeCodeBlocks = (node: AnyNode) => {
  if (node.type === 'block' && node.fields?.blockType === 'code') {
    node.fields.language = normalizeCodeLanguage(node.fields.language)
  }
  node.children?.forEach(normalizeCodeBlocks)
}

/**
 * Відкривальні ```fence завжди з явною мовою зі списку блоку коду:
 * конвертер Payload без мови склеює "undefined" з кодом, а `c++`/`c#` чи
 * інфо-рядок (```ts title="x") розбирає неправильно
 */
const normalizeFences = (markdown: string) => {
  let inFence = false
  return markdown
    .split('\n')
    .map((line) => {
      if (inFence) {
        if (/^\s*```\s*$/.test(line)) inFence = false
        return line
      }
      const open = /^(\s*)```\s*([^\s`]*)[^`]*$/.exec(line)
      if (!open) return line
      inFence = true
      return `${open[1]}\`\`\`${normalizeCodeLanguage(open[2])}`
    })
    .join('\n')
}

// YAML front matter на початку файлу (--- ... ---) — не частина тексту поста
const stripFrontMatter = (markdown: string) => markdown.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')

/** field — уже санітизоване richText-поле з конфігу (з editorConfig усередині) */
export function markdownToLexical({
  field,
  markdown,
}: {
  field: RichTextField
  markdown: string
}): DefaultTypedEditorState {
  const editorConfig = editorConfigFactory.fromField({ field })
  const state = convertMarkdownToLexical({
    editorConfig,
    markdown: normalizeFences(stripFrontMatter(markdown.replace(/\r\n?/g, '\n'))),
  })
  normalizeCodeBlocks(state.root as AnyNode)
  return state
}
