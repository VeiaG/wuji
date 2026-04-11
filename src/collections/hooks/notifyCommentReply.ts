import type { CollectionAfterChangeHook } from 'payload'
import { createNotification } from '@/lib/notifications'

export const notifyCommentReply: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Тільки при створенні нового коментаря з parent (відповідь)
  if (operation !== 'create' || !doc.parent) return

  const parentId = typeof doc.parent === 'string' ? doc.parent : doc.parent?.id
  if (!parentId) return

  try {
    const parentComment = await req.payload.findByID({
      collection: 'chapterComments',
      id: parentId,
      depth: 0,
    })

    if (!parentComment) return

    const parentUserId = typeof parentComment.user === 'string'
      ? parentComment.user
      : parentComment.user?.id

    if (!parentUserId) return

    // Не надсилаємо сповіщення собі
    const replierId = typeof doc.user === 'string' ? doc.user : doc.user?.id
    if (parentUserId === replierId) return

    const replierName =
      (typeof doc.user === 'object' && (doc.user?.nickname || doc.user?.email)) || 'Хтось'
    const chapterId = typeof doc.chapter === 'string' ? doc.chapter : doc.chapter?.id

    await createNotification(req.payload, {
      userId: parentUserId,
      title: `${replierName} відповів на ваш коментар`,
      message: doc.content?.slice(0, 200) ?? undefined,
      type: 'info',
      link: chapterId ? `/redirect/novel/${chapterId}?disableSaving=true` : undefined,
    })
  } catch (error) {
    console.error('[notifyCommentReply] Failed:', error)
  }
}
