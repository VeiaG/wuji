import ResetPasswordPage from '@/components/reset-password-page'
import { Tile } from '@/components/bento'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function ResetPasswordPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="container-page pb-10 pt-6 md:pt-14">
          <Tile className="mx-auto flex w-full max-w-[440px] flex-col items-center gap-3 p-7 text-center md:p-9">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-muted-foreground">Завантаження...</p>
          </Tile>
        </div>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  )
}

export default ResetPasswordPageWrapper
