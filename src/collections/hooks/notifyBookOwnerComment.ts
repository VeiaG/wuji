import type { CollectionAfterChangeHook } from 'payload'
import { createNotification } from '@/lib/notifications'

/**
 * Notifies the owner (writer) of an original book when someone leaves a comment
 * in one of its chapters — top-level comments as well as replies.
 *
 * De-duplication: if the comment is a reply to the owner's own comment, the owner
 * already receives a "reply" notification from `notifyCommentReply`, so this hook
 * skips it to avoid a double notification.
 *
 * The owner can opt out via the `notifyOnBookComments` preference on their user.
 */
export const notifyBookOwnerComment: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return

  const chapterId = typeof doc.chapter === 'string' ? doc.chapter : doc.chapter?.id
  if (!chapterId) return

  try {
    // depth 2: chapter -> book -> owner (fully populated to read the owner's preference)
    const chapter = await req.payload.findByID({
      collection: 'bookChapters',
      id: chapterId,
      depth: 2,
    })

    const book = chapter?.book
    if (!book || typeof book !== 'object') return

    const owner = book.owner
    // Only original books have an owner; translations are skipped.
    if (!owner || typeof owner !== 'object') return

    const ownerId = owner.id

    // Don't notify writers who commented on their own book.
    const commenterId = typeof doc.user === 'string' ? doc.user : doc.user?.id
    if (!commenterId || commenterId === ownerId) return

    // Respect the owner's opt-out preference (defaults to enabled).
    if (owner.notifyOnBookComments === false) return

    // De-dup: a reply to the owner's own comment already triggers notifyCommentReply.
    const parentId = typeof doc.parent === 'string' ? doc.parent : doc.parent?.id
    if (parentId) {
      const parentComment = await req.payload.findByID({
        collection: 'chapterComments',
        id: parentId,
        depth: 0,
      })
      const parentUserId =
        typeof parentComment?.user === 'string' ? parentComment.user : parentComment?.user?.id
      if (parentUserId === ownerId) return
    }

    // Resolve the commenter's display name (doc.user may be an id or a populated object).
    let commenterName = 'Хтось'
    if (typeof doc.user === 'object' && doc.user) {
      commenterName = doc.user.nickname || doc.user.email || commenterName
    } else if (commenterId) {
      const commenter = await req.payload.findByID({
        collection: 'users',
        id: commenterId,
        depth: 0,
      })
      commenterName = commenter?.nickname || commenter?.email || commenterName
    }

    const bookTitle = book.title ?? 'вашій книзі'

    await createNotification(req.payload, {
      userId: ownerId,
      title: `Новий коментар у «${bookTitle}»`,
      message: `${commenterName}: ${doc.content?.slice(0, 200) ?? ''}`,
      type: 'info',
      category: 'comment',
      link: `/redirect/novel/${chapterId}?disableSaving=true`,
    })
  } catch (error) {
    console.error('[notifyBookOwnerComment] Failed:', error)
  }
}
