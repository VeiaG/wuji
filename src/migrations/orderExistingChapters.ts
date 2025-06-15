import { MigrateUpArgs } from '@payloadcms/db-mongodb'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { docs } = await payload.find({
    collection: 'bookChapters',
    where: { _order: { exists: false } },
    req,
  })

  for (const doc of docs) {
    await payload.update({
      collection: 'bookChapters',
      data: {
        // no data needed since the order hooks will handle this
      },
      id: doc.id,
      req,
    })
  }
}
