import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { checkRole } from '@/collections/access/checkRole'
import type { User } from '@/payload-types'
import { ComplaintsReviewClient } from './ComplaintsReview.client'

// Робоче місце для розбору скарг на переклад: /admin/complaints-review
export const ComplaintsReview = async ({
  initPageResult,
  params,
  searchParams,
  viewActions,
}: AdminViewServerProps) => {
  const { req } = initPageResult
  const user = req.user as User | null
  // як і колекція скарг: адміни та редактори (обмеження за книгами — в access колекції)
  const allowed = checkRole(['admin', 'editor'], user)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      req={req}
      visibleEntities={initPageResult.visibleEntities}
      viewActions={viewActions}
    >
      {allowed ? (
        <ComplaintsReviewClient />
      ) : (
        <Gutter>
          <p>Немає доступу до скарг.</p>
        </Gutter>
      )}
    </DefaultTemplate>
  )
}
