import type { HighlighterCore, LanguageRegistration, ThemedToken } from 'shiki/core'
import type { CodeLanguage } from './code-languages'

type LangLoader = () => Promise<{ default: LanguageRegistration[] }>

// Лише потрібні граматики: кожна вантажиться окремим чанком при першому використанні
const langLoaders: Record<Exclude<CodeLanguage, 'plaintext'>, LangLoader> = {
  typescript: () => import('shiki/langs/typescript.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  scss: () => import('shiki/langs/scss.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  shell: () => import('shiki/langs/shellscript.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  go: () => import('shiki/langs/go.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  cpp: () => import('shiki/langs/cpp.mjs'),
  csharp: () => import('shiki/langs/csharp.mjs'),
  php: () => import('shiki/langs/php.mjs'),
  graphql: () => import('shiki/langs/graphql.mjs'),
  dockerfile: () => import('shiki/langs/dockerfile.mjs'),
  xml: () => import('shiki/langs/xml.mjs'),
}

const THEME = 'github-dark-default'

let highlighterPromise: Promise<HighlighterCore> | null = null
const loadedLangs = new Map<string, Promise<string | null>>()

function getHighlighter() {
  highlighterPromise ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, theme] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
      import('shiki/themes/github-dark-default.mjs'),
    ])
    return createHighlighterCore({
      themes: [theme.default],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return highlighterPromise
}

/** Завантажує граматику й повертає id мови в shiki (null — підсвітки немає) */
function ensureLanguage(highlighter: HighlighterCore, lang: string) {
  if (!(lang in langLoaders)) return Promise.resolve(null)
  let promise = loadedLangs.get(lang)
  if (!promise) {
    promise = langLoaders[lang as keyof typeof langLoaders]().then(async (mod) => {
      await highlighter.loadLanguage(...mod.default)
      // Останній запис у модулі — сама мова, попередні — вбудовані в неї граматики
      return mod.default[mod.default.length - 1].name
    })
    loadedLangs.set(lang, promise)
  }
  return promise
}

export async function highlightCode(code: string, lang: string): Promise<ThemedToken[][] | null> {
  const highlighter = await getHighlighter()
  const shikiLang = await ensureLanguage(highlighter, lang)
  if (!shikiLang) return null
  return highlighter.codeToTokensBase(code, { lang: shikiLang, theme: THEME })
}
