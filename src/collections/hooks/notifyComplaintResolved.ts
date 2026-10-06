import type { CollectionAfterChangeHook } from 'payload'
import { createNotification } from '@/lib/notifications'

// Коли скаргу позначили «Виправлено» — дякуємо автору скарги сповіщенням
export const notifyComplaintResolved: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') return
  if (doc.status !== 'resolved' || previousDoc?.status === 'resolved') return

  const userId = typeof doc.user === 'string' ? doc.user : doc.user?.id
  if (!userId) return

  // Не надсилаємо сповіщення собі
  if (req.user?.id === userId) return

  try {
    const bookId = typeof doc.book === 'string' ? doc.book : doc.book?.id
    const book = bookId
      ? await req.payload.findByID({ collection: 'books', id: bookId, depth: 0, req })
      : null
    const chapterId = typeof doc.chapter === 'string' ? doc.chapter : doc.chapter?.id

    const fragment =
      doc.selectedText.length > 160 ? `${doc.selectedText.slice(0, 160)}…` : doc.selectedText
    const where = book?.title ? `${book.title}, розділ ${doc.pageNumber}` : `Розділ ${doc.pageNumber}`

    await createNotification(req.payload, {
      userId,
      title: 'Вашу скаргу на переклад виправлено',
      message: `«${fragment}»\n\n${where}. Дякуємо, що допомагаєте робити переклад кращим!`,
      type: 'info',
      category: 'system',
      link: chapterId ? `/redirect/novel/${chapterId}?disableSaving=true` : undefined,
    })
  } catch (error) {
    console.error('[notifyComplaintResolved] Failed:', error)
  }
}
