'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Banner,
  Button,
  CheckboxInput,
  Form,
  RenderFields,
  ShimmerEffect,
  TextInput,
  toast,
  useConfig,
  useForm,
  useFormModified,
  useServerFunctions,
} from '@payloadcms/ui'
import type { ClientField, FormState } from 'payload'
import { getNearestEditorFromDOMNode, type LexicalEditor } from '@payloadcms/richtext-lexical/lexical'
import type { Complaint } from '@/payload-types'
import {
  $buildTextIndex,
  findFragment,
  replaceFragment,
  scrollToHighlight,
  toDomRange,
  type FoundRange,
} from './lexicalRanges'

const baseClass = 'complaints-review'

type Props = {
  chapterId: string
  active: Complaint
  /** Усі відкриті скарги цього розділу, разом з активною */
  chapterComplaints: Complaint[]
  apiURL: string
  onSelect: (id: string) => void
  onModifiedChange: (modified: boolean) => void
  /** Змінює статус скарг і переходить до наступної */
  onStatus: (ids: string[], status: 'resolved' | 'rejected') => Promise<void>
  onSkip: () => void
  /** Оновити назву розділу в шапці скарги після збереження */
  onChapterSaved: (title: string) => void
}

// Розділ у формі Payload + lexical-редактор з підсвіткою скарг
export function ChapterWorkspace(props: Props) {
  const { chapterId, apiURL } = props
  const { getFormState } = useServerFunctions()
  const { getEntityConfig } = useConfig()
  const [state, setState] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Назва й текст розділу — обидва можна правити тут же
  const fields = useMemo(() => {
    const all = getEntityConfig({ collectionSlug: 'bookChapters' })?.fields ?? []
    const pick = (name: string) => all.find((f) => 'name' in f && f.name === name) as ClientField | undefined
    const title = pick('title')
    const content = pick('content')
    return title && content ? [title, content] : null
  }, [getEntityConfig])

  useEffect(() => {
    const controller = new AbortController()
    setState(null)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`${apiURL}/bookChapters/${chapterId}?depth=0&select[title]=true&select[content]=true`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Не вдалося завантажити розділ (${res.status})`)
        const doc = await res.json()
        const result = await getFormState({
          collectionSlug: 'bookChapters',
          id: chapterId,
          schemaPath: 'bookChapters',
          operation: 'update',
          data: { title: doc.title, content: doc.content },
          select: { title: true, content: true },
          docPermissions: { fields: true, read: true, update: true } as never,
          docPreferences: { fields: {} },
          renderAllFields: true,
          signal: controller.signal,
        })
        if (!result || !('state' in result) || !result.state) throw new Error('Не вдалося підготувати редактор')
        setState(result.state)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
    return () => controller.abort()
  }, [apiURL, chapterId, getFormState, reloadKey])

  if (error) return <Banner type="error">{error}</Banner>
  if (!state || !fields) return <ShimmerEffect height={480} />

  return (
    <Form initialState={state} onSubmit={() => {}} className={`${baseClass}__form`}>
      <Workspace {...props} fields={fields} onReload={() => setReloadKey((k) => k + 1)} />
    </Form>
  )
}

function Workspace({
  chapterId,
  active,
  chapterComplaints,
  apiURL,
  onSelect,
  onModifiedChange,
  onStatus,
  onSkip,
  onChapterSaved,
  fields,
  onReload,
}: Props & { fields: ClientField[]; onReload: () => void }) {
  const { getDataByPath, setModified } = useForm()
  const modified = useFormModified()
  const editorHostRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<LexicalEditor | null>(null)
  const [found, setFound] = useState<Record<string, FoundRange | null>>({})
  const [replacement, setReplacement] = useState(active.selectedText)
  const [alsoResolve, setAlsoResolve] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const others = chapterComplaints.filter((c) => c.id !== active.id)
  const activeRange = found[active.id]

  useEffect(() => onModifiedChange(modified), [modified, onModifiedChange])
  useEffect(() => () => onModifiedChange(false), [onModifiedChange])

  useEffect(() => {
    setReplacement(active.selectedText)
    setAlsoResolve([])
  }, [active.id, active.selectedText])

  // Lexical монтується асинхронно — чекаємо на contenteditable
  useEffect(() => {
    const host = editorHostRef.current
    if (!host) return
    const attach = () => {
      const root = host.querySelector<HTMLElement>('[data-lexical-editor="true"]')
      const instance = root ? getNearestEditorFromDOMNode(root) : null
      if (instance) {
        setEditor(instance)
        return true
      }
      return false
    }
    if (attach()) return
    const observer = new MutationObserver(() => attach() && observer.disconnect())
    observer.observe(host, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  // Підсвітка: активна скарга яскраво, інші скарги розділу — слабше
  const paint = useCallback(() => {
    if (!editor) return
    const next: Record<string, FoundRange | null> = {}
    const activeRanges: Range[] = []
    const otherRanges: Range[] = []
    editor.getEditorState().read(() => {
      const index = $buildTextIndex()
      for (const c of chapterComplaints) {
        const range = findFragment(index, c.selectedText, c.position)
        next[c.id] = range
        const dom = range && toDomRange(editor, index, range)
        if (dom) (c.id === active.id ? activeRanges : otherRanges).push(dom)
      }
    })
    if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
      CSS.highlights.set('complaint-active', new Highlight(...activeRanges))
      CSS.highlights.set('complaint-other', new Highlight(...otherRanges))
    }
    setFound((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    return activeRanges[0]
  }, [editor, chapterComplaints, active.id])

  useEffect(() => {
    if (!editor) return
    const unregister = editor.registerUpdateListener(() => paint())
    return () => {
      unregister()
      if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
        CSS.highlights.delete('complaint-active')
        CSS.highlights.delete('complaint-other')
      }
    }
  }, [editor, paint])

  // Прокрутка лише на вимогу: після кліку на іншу скаргу розділу — коли її вже підсвічено
  const scrollPending = useRef(false)
  useEffect(() => {
    paint()
    if (!scrollPending.current) return
    scrollPending.current = false
    const frame = requestAnimationFrame(() => scrollToHighlight('complaint-active'))
    return () => cancelAnimationFrame(frame)
  }, [paint])

  const applyReplacement = (text: string) => {
    if (!editor || !activeRange) return
    if (!replaceFragment(editor, active.selectedText, activeRange, text)) {
      toast.error('Фрагмент не знайдено в тексті')
    }
  }

  const saveChapter = async () => {
    const res = await fetch(`${apiURL}/bookChapters/${chapterId}?depth=0&select[id]=true`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: getDataByPath('title'), content: getDataByPath('content') }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.errors?.[0]?.message ?? `Не вдалося зберегти розділ (${res.status})`)
    }
    setModified(false)
    onChapterSaved(getDataByPath('title') as string)
  }

  const resolve = async () => {
    setBusy(true)
    try {
      if (modified) await saveChapter()
      await onStatus([active.id, ...alsoResolve], 'resolved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const reject = async () => {
    setBusy(true)
    try {
      await onStatus([active.id], 'rejected')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  // Відхилити останню скаргу розділу з незбереженими правками = загубити правки
  const lastInChapter = others.length === 0
  const blockLeave = modified && lastInChapter

  return (
    <>
      <section className={`${baseClass}__fix`}>
        {activeRange === null && (
          <Banner type="info">
            Фрагмент не знайдено в поточному тексті — можливо, його вже виправили. Перевірте розділ і
            закрийте скаргу.
          </Banner>
        )}
        <div className={`${baseClass}__replace`}>
          <TextInput
            label="Замінити на"
            path="complaint-replacement"
            value={replacement}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplacement(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyReplacement(replacement)
              }
            }}
            readOnly={!activeRange}
          />
          <Button
            buttonStyle="secondary"
            margin={false}
            disabled={!activeRange || replacement === active.selectedText}
            onClick={() => applyReplacement(replacement)}
          >
            Замінити
          </Button>
          <Button
            buttonStyle="secondary"
            margin={false}
            disabled={!activeRange}
            onClick={() => applyReplacement('')}
          >
            Видалити фрагмент
          </Button>
        </div>
      </section>

      {others.length > 0 && (
        <section className={`${baseClass}__others`}>
          <h3 className={`${baseClass}__others-title`}>Інші скарги в цьому розділі</h3>
          <ul className={`${baseClass}__others-list`}>
            {others.map((c) => (
              <li key={c.id} className={`${baseClass}__other`}>
                <CheckboxInput
                  checked={alsoResolve.includes(c.id)}
                  onToggle={() =>
                    setAlsoResolve((prev) =>
                      prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                    )
                  }
                  label="Теж виправлено"
                />
                <button
                  type="button"
                  className={`${baseClass}__other-text`}
                  onClick={() => {
                    scrollPending.current = true
                    onSelect(c.id)
                  }}
                >
                  «{c.selectedText}»
                  {found[c.id] === null && <span className={`${baseClass}__muted`}> · не знайдено</span>}
                </button>
                {c.description && <p className={`${baseClass}__other-note`}>{c.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div ref={editorHostRef} className={`${baseClass}__editor`}>
        <RenderFields
          fields={fields}
          forceRender
          parentIndexPath=""
          parentPath=""
          parentSchemaPath="bookChapters"
          permissions={true}
        />
      </div>

      <div className={`${baseClass}__actions`}>
        <div className={`${baseClass}__actions-side`}>
          <Button
            buttonStyle="secondary"
            margin={false}
            disabled={busy || blockLeave}
            tooltip={blockLeave ? 'Спершу збережіть або скасуйте зміни' : undefined}
            onClick={reject}
          >
            Відхилити
          </Button>
          <Button buttonStyle="subtle" margin={false} disabled={busy || blockLeave} onClick={onSkip}>
            Пропустити
          </Button>
        </div>
        <div className={`${baseClass}__actions-side`}>
          {modified && (
            <Button buttonStyle="subtle" margin={false} disabled={busy} onClick={onReload}>
              Скасувати зміни
            </Button>
          )}
          <Button buttonStyle="primary" margin={false} disabled={busy} onClick={resolve}>
            {modified ? 'Зберегти й позначити виправленою' : 'Позначити виправленою'}
            {alsoResolve.length > 0 && ` (+${alsoResolve.length})`}
          </Button>
        </div>
      </div>
    </>
  )
}
