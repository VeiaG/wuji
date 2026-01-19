import type { CollectionAfterChangeHook } from 'payload'
import type { User } from '@/payload-types'

/**
 * Hook to automatically delete old avatar and banner files when they are replaced
 *
 * This hook runs after a User document is updated and checks if the avatar or banner
 * has changed. If so, it deletes the old file from the user-uploads collection.
 */
export const deleteOldUserUploads: CollectionAfterChangeHook<User> = async ({
  doc, // New document after changes
  previousDoc, // Document before changes
  req, // Request object with payload instance
  operation, // 'create' or 'update'
}) => {
  // Only run on update operations (not on create)
  if (operation !== 'update') {
    return doc
  }

  const filesToDelete: string[] = []

  // Helper function to extract ID from avatar/banner field
  const getFileId = (field: string | { id: string } | null | undefined): string | null => {
    if (!field) return null
    if (typeof field === 'string') return field
    if (typeof field === 'object' && field.id) return field.id
    return null
  }

  // Check if avatar changed
  const oldAvatarId = getFileId(previousDoc.avatar)
  const newAvatarId = getFileId(doc.avatar)

  // If avatar changed or was removed, delete old file
  if (oldAvatarId && oldAvatarId !== newAvatarId) {
    filesToDelete.push(oldAvatarId)
  }

  // Check if banner changed
  const oldBannerId = getFileId(previousDoc.banner)
  const newBannerId = getFileId(doc.banner)

  // If banner changed or was removed, delete old file
  if (oldBannerId && oldBannerId !== newBannerId) {
    filesToDelete.push(oldBannerId)
  }

  // Delete old files if any
  if (filesToDelete.length > 0) {
    try {
      // Delete files from user-uploads collection
      await Promise.all(
        filesToDelete.map(async (fileId) => {
          try {
            await req.payload.delete({
              collection: 'user-uploads',
              id: fileId,
              // Use the request for proper authentication context
              req,
            })
            req.payload.logger.info(`Deleted old user upload file: ${fileId}`)
          } catch (error) {
            // Log error but don't fail the whole operation
            const errorMessage = error instanceof Error ? error.message : String(error)
            req.payload.logger.error(
              `Failed to delete old user upload file ${fileId}: ${errorMessage}`,
            )
          }
        }),
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      req.payload.logger.error(`Error deleting old user uploads: ${errorMessage}`)
    }
  }

  return doc
}
