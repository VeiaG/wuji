import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Component() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Реєстрація успішна!</h1>
          <p className="text-muted-foreground">
            Ваш обліковий запис було створено. Тепер ви можете одразу увійти в систему.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Перейти до входу</Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Виникли питання?{' '}
              <Link href="https://veiag.dev/" className="text-primary hover:underline">
                Зв&apos;яжіться з підтримкою
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
