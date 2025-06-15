'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

type VerificationStatus = 'loading' | 'success' | 'error' | 'invalid'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [message, setMessage] = useState('')

  const verifyToken = async (token: string) => {
    try {
      // Verify token on payload

      const response = await fetch(`/api/users/verify/${token}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        //get error message from response
        const errorData = await response.json()
        const errorMessage =
          errorData?.errors?.[0]?.message || 'Помилка сервера. Спробуйте пізніше.'

        if (errorMessage === 'Verification token is invalid.') {
          return { success: false, message: 'Недійсний або застарілий токен' }
        } else {
          return { success: false, message: errorMessage }
        }
      }

      // Default success response
      return { success: true, message: 'Електронну пошту успішно підтверджено' }
    } catch {
      return { success: false, message: 'Помилка сервера. Спробуйте пізніше.' }
    }
  }

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      setMessage('Відсутній токен підтвердження')
      return
    }

    const verify = async () => {
      const result = await verifyToken(token)
      setStatus(result.success ? 'success' : 'error')
      setMessage(result.message)
    }

    verify()
  }, [token])

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Підтвердження електронної пошти
            </h1>
            <p className="text-muted-foreground">Будь ласка, зачекайте...</p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">Підтвердження успішне!</h1>
            <p className="text-muted-foreground mb-6">{message}</p>

            <Alert className="mb-6">
              <AlertDescription>
                Тепер ви можете увійти у свій обліковий запис та користуватися всіма функціями
                платформи.
              </AlertDescription>
            </Alert>

            <Button asChild className="w-full">
              <Link href="/login">Увійти в обліковий запис</Link>
            </Button>
          </div>
        )

      case 'error':
      case 'invalid':
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Помилка підтвердження</h1>
            <p className="text-muted-foreground mb-6">{message}</p>

            <Alert
              className="border-destructive/20 bg-destructive/5 mb-6 text-destructive"
              variant="destructive"
            >
              <Mail className="h-4 w-4 " />
              <AlertDescription className="text-destructive">
                Можливо, посилання застаріло або було використано раніше. Спробуйте зареєструватися
                знову або зв&apos;яжіться з підтримкою.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">Зареєструватися знову</Link>
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="https://veiag.dev/">Зв&apos;язатися з підтримкою</Link>
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {renderContent()}

        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Повернутися на головну
          </Link>
        </div>
      </div>
    </div>
  )
}
