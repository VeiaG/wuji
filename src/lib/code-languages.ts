// Ключі — id мов Monaco (редактор в адмінці); для shiki вони перекладаються в src/lib/shiki.ts
export const codeLanguages = {
  plaintext: 'Plain Text',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  yaml: 'YAML',
  markdown: 'Markdown',
  shell: 'Shell',
  python: 'Python',
  sql: 'SQL',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  cpp: 'C++',
  csharp: 'C#',
  php: 'PHP',
  graphql: 'GraphQL',
  dockerfile: 'Dockerfile',
  xml: 'XML',
} as const

export type CodeLanguage = keyof typeof codeLanguages
