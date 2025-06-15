import { CheckCircle, Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
          <p className="text-muted-foreground">Ваш обліковий запис було створено</p>
        </div>

        <div className="space-y-6">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Підтвердіть свою електронну пошту</strong>
              Ми надіслали лист з підтвердженням на вашу електронну адресу.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-2">Що робити далі:</h3>
              <ol className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                    1
                  </span>
                  Перевірте свою поштову скриньку
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                    2
                  </span>
                  Якщо листа немає, перевірте папку &quot;Спам&quot;
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                    3
                  </span>
                  Натисніть на посилання підтвердження
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                    4
                  </span>
                  Увійдіть у свій обліковий запис
                </li>
              </ol>
            </div>
          </div>

          <Alert className="border-yellow-500/20 bg-yellow-500/5 text-yellow-500">
            <AlertCircle className="h-4 w-4 " />
            <AlertDescription className="text-yellow-500">
              <strong>Важливо:</strong> Ви не зможете увійти в систему до підтвердження електронної
              пошти.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Перейти до входу</Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Не отримали лист?{' '}
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
