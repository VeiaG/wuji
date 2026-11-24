'use client'

import React from 'react'
import {
  Button,
  ConfirmationModal,
  toast,
  useAuth,
  useConfig,
  useDocumentInfo,
  useFormFields,
  useModal,
  useRouter,
} from '@payloadcms/ui'
import type { User } from '@/payload-types'
import './AttachToBook.css'

const baseClass = 'attach-to-book'

/**
 * Кнопка «Перенести розділи» в сайдбарі заявки. Цільову книгу обирають у нативному
 * віртуальному полі `targetBook` над нею; перенесення робить сервер
 * (POST /api/bookRequests/:id/attach), лише для адміна.
 */
export function AttachToBook() {
  const { user } = useAuth<User>()
  const { id } = useDocumentInfo()
  const { config } = useConfig()
  const targetBook = useFormFields(([fields]) => fields.targetBook?.value)
  const { openModal } = useModal()
  const router = useRouter()

  if (!user?.roles?.includes('admin') || !id) return null

  const bookId =
    typeof targetBook === 'string'
      ? targetBook
      : targetBook && typeof targetBook === 'object' && 'id' in targetBook
        ? String((targetBook as { id: unknown }).id)
        : null

  const modalSlug = `attach-book-request-${id}`

  // ConfirmationModal сам показує стан завантаження і закривається після onConfirm
  const attach = async () => {
    if (!bookId) return
    try {
      const res = await fetch(`${config.serverURL}${config.routes.api}/bookRequests/${id}/attach`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; moved?: number }
      if (!res.ok) {
        toast.error(json.error ?? 'Не вдалося перенести розділи')
        return
      }
      toast.success(`Перенесено розділів: ${json.moved ?? 0}`)
      router.push(`${config.routes.admin}/collections/books/${bookId}`)
    } catch {
      toast.error('Не вдалося перенести розділи')
    }
  }

  return (
    <div className={`field-type ${baseClass}`}>
      <Button
        buttonStyle="primary"
        disabled={!bookId}
        margin={false}
        onClick={() => openModal(modalSlug)}
        type="button"
      >
        Перенести розділи
      </Button>
      <ConfirmationModal
        body="Усі розділи заявки буде перенесено в обрану книгу, а заявку закрито. Скасувати це не можна."
        cancelLabel="Скасувати"
        confirmingLabel="Переносимо…"
        confirmLabel="Перенести"
        heading="Перенести розділи в книгу?"
        modalSlug={modalSlug}
        onConfirm={attach}
      />
    </div>
  )
}
