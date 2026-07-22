import { MigrateUpArgs } from '@payloadcms/db-mongodb'

// Notifications created before the `category` field existed have no value for it.
// Backfill them to 'system' so filters (which query by category) behave consistently.
// Documents that already carry a category are left untouched.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { docs } = await payload.find({
    collection: 'notifications',
    select: { category: true },
    where: {
      or: [{ category: { exists: false } }, { category: { equals: null } }],
    },
    pagination: false,
    req,
  })

  for (const doc of docs) {
    await payload.update({
      collection: 'notifications',
      id: doc.id,
      data: { category: 'system' },
      req,
    })
  }
}
