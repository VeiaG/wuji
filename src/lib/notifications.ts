import type { BasePayload } from 'payload'

export interface CreateNotificationParams {
  userId: string
  title: string
  message?: string
  type?: 'info' | 'warning' | 'error'
  category?: 'comment' | 'reply' | 'system'
  link?: string
}

/**
 * Server-side utility to create a notification for a user.
 * Use this in Payload hooks, server actions, or API routes.
 *
 * @example
 * // In a Payload afterChange hook on ChapterComment (reply to comment):
 * await createNotification(payload, {
 *   userId: parentComment.user as string,
 *   title: 'Нова відповідь на ваш коментар',
 *   message: `${req.user.nickname} відповів на ваш коментар`,
 *   type: 'info',
 *   link: `/novel/${bookSlug}/${chapterNum}`,
 * })
 */
export async function createNotification(
  payload: BasePayload,
  params: CreateNotificationParams,
): Promise<void> {
  const { userId, title, message, type = 'info', category = 'system', link } = params

  try {
    await payload.create({
      collection: 'notifications',
      data: {
        user: userId,
        title,
        message: message ?? null,
        type,
        category,
        read: false,
        link: link ?? null,
      },
      overrideAccess: true,
    })
  } catch (error) {
    console.error('[createNotification] Failed:', error)
  }
}
