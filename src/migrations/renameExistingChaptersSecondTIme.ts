import { MigrateUpArgs } from '@payloadcms/db-mongodb'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { docs } = await payload.find({
    collection: 'bookChapters',
    select: {
      title: true,
    },
    limit: 0,
    req,
  })
  payload.logger.info('Renaming existing chapters...')

  for (const doc of docs) {
    payload.logger.info(`Renaming chapter ${doc.title} to ${doc.title.replace('Розділ', 'Глава')}`)
    await payload.update({
      collection: 'bookChapters',
      data: {
        title: doc.title.replace('Розділ', 'Глава'),
      },
      id: doc.id,
      req,
    })
  }
}
