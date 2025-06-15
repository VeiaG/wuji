import VerifyPage from '@/components/verify-page'
import { Suspense } from 'react'

function VerifyPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Завантаження...</p>
          </div>
        </div>
      }
    >
      <VerifyPage />
    </Suspense>
  )
}

export default VerifyPageWrapper
