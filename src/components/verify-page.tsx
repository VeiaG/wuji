'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tile } from '@/components/bento'
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


  const iconBox = (children: React.ReactNode, destructive = false) => (
    <div
      className={`mb-2 grid size-14 place-items-center rounded-2xl ${destructive ? 'bg-destructive/15' : 'bg-primary/15'}`}
    >
      {children}
    </div>
  )

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center gap-2 text-center">
            {iconBox(<Loader2 className="size-7 animate-spin text-primary" />)}
            <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Підтвердження електронної пошти</h1>
            <p className="text-[15px] text-muted-foreground">Будь ласка, зачекайте...</p>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col items-center gap-2 text-center">
            {iconBox(<CheckCircle className="size-7 text-primary" />)}
            <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Підтвердження успішне!</h1>
            <p className="text-[15px] text-muted-foreground">{message}</p>

            <div className="mt-4 w-full rounded-2xl bg-chip p-4 text-left text-sm text-soft">
              Тепер ви можете увійти у свій обліковий запис та користуватися всіма функціями
              платформи.
            </div>

            <Button asChild className="mt-2 h-12 w-full rounded-2xl text-[15px]">
              <Link href="/login">Увійти в обліковий запис</Link>
            </Button>
          </div>
        )

      case 'error':
      case 'invalid':
        return (
          <div className="flex flex-col items-center gap-2 text-center">
            {iconBox(<XCircle className="size-7 text-destructive" />, true)}
            <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Помилка підтвердження</h1>
            <p className="text-[15px] text-muted-foreground text-balance">{message}</p>

            <div className="mt-4 w-full rounded-2xl bg-destructive/10 p-4 text-left text-sm text-destructive">
              Можливо, посилання застаріло або було використано раніше. Спробуйте зареєструватися
              знову або зв&apos;яжіться з підтримкою.
            </div>

            <div className="mt-2 flex w-full flex-col gap-2.5">
              <Button asChild className="h-12 w-full rounded-2xl text-[15px]">
                <Link href="/register">Зареєструватися знову</Link>
              </Button>

              <Button asChild variant="secondary" className="h-12 w-full rounded-2xl text-[15px]">
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
    <div className="container-page pb-10 pt-6 md:pt-14">
      <Tile className="mx-auto flex w-full max-w-[440px] flex-col gap-6 p-7 md:p-9">
        {renderContent()}

        <Link href="/" className="text-center text-sm font-semibold text-primary hover:opacity-90">
          ← Повернутися на головну
        </Link>
      </Tile>
    </div>
  )
}
