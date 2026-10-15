'use client'

import React, { useState } from 'react'
import {
  Button,
  Drawer,
  toast,
  useConfig,
  useForm,
  useModal,
} from '@payloadcms/ui'
import type { CollectionSlug } from 'payload'
import './MarkdownImport.scss'

const baseClass = 'markdown-import'

type Props = {
  collection: CollectionSlug
  target: string
}

type LexicalState = { root: { children: unknown[] } & Record<string, unknown> }

const isEmptyState = (state: LexicalState | null | undefined) => {
  const children = state?.root?.children ?? []
  if (children.length === 0) return true
  // Порожній редактор — один абзац без тексту
  return (
    children.length === 1 &&
    (children[0] as { type?: string; children?: unknown[] }).type === 'paragraph' &&
    !(children[0] as { children?: unknown[] }).children?.length
  )
}

export function MarkdownImport({ collection, target }: Props) {
  const { config } = useConfig()
  const { dispatchFields, getField, setModified } = useForm()
  const { closeModal, openModal } = useModal()
  const [markdown, setMarkdown] = useState('')
  const [busy, setBusy] = useState(false)

  const drawerSlug = `markdown-import-${target}`

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMarkdown(await file.text())
  }

  const apply = async (mode: 'append' | 'replace') => {
    if (!markdown.trim()) return
    const current = getField(target)?.value as LexicalState | undefined
    if (
      mode === 'replace' &&
      !isEmptyState(current) &&
      !window.confirm('Поточний вміст буде замінено. Продовжити?')
    ) {
      return
    }

    setBusy(true)
    try {
      const res = await fetch(
        `${config.serverURL}${config.routes.api}/${collection}/markdown-to-lexical`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: target, markdown }),
        },
      )
      const data = (await res.json().catch(() => ({}))) as { error?: string; state?: LexicalState }
      if (!res.ok || !data.state) throw new Error(data.error || `Помилка ${res.status}`)

      const imported = data.state
      const value =
        mode === 'append' && current && !isEmptyState(current)
          ? {
              ...current,
              root: {
                ...current.root,
                children: [...current.root.children, ...imported.root.children],
              },
            }
          : imported

      // Lexical-поле перемонтовує редактор лише при зміні initialValue
      dispatchFields({ type: 'UPDATE', path: target, value, initialValue: value })
      setModified(true)
      closeModal(drawerSlug)
      setMarkdown('')
      toast.success(mode === 'append' ? 'Markdown додано в кінець' : 'Вміст замінено з Markdown')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={baseClass}>
      <Button buttonStyle="secondary" size="small" margin={false} onClick={() => openModal(drawerSlug)}>
        Імпорт з Markdown
      </Button>

      <Drawer slug={drawerSlug} title="Імпорт з Markdown">
        <div className={`${baseClass}__body`}>
          <p className={`${baseClass}__hint`}>
            Вставте Markdown або виберіть .md файл. Блоки ```мова стають блоками коду,
            front matter (--- … ---) ігнорується.
          </p>
          <label className={`${baseClass}__file`}>
            <span>Файл:</span>
            <input type="file" accept=".md,.markdown,.mdx,text/markdown,text/plain" onChange={onFile} />
          </label>
          <textarea
            className={`${baseClass}__textarea`}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={'# Заголовок\n\nТекст…\n\n```ts\nconst a = 1\n```'}
            rows={20}
            spellCheck={false}
          />
          <div className={`${baseClass}__actions`}>
            <Button margin={false} disabled={busy || !markdown.trim()} onClick={() => apply('replace')}>
              Замінити вміст
            </Button>
            <Button
              buttonStyle="secondary"
              margin={false}
              disabled={busy || !markdown.trim()}
              onClick={() => apply('append')}
            >
              Додати в кінець
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
