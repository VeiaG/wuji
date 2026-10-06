'use client'

import type React from 'react'

import { useState } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tile } from '@/components/bento'
import Link from 'next/link'
import { useAuth } from '@/providers/auth'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [message, setMessage] = useState('')
  const { forgotPassword } = useAuth()

  const sendResetEmail = async (email: string) => {
    try {
      forgotPassword({
        email,
      })

      return { success: true, message: 'Лист з інструкціями надіслано на вашу електронну пошту' }
    } catch {
      return { success: false, message: 'Помилка сервера. Спробуйте пізніше.' }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setStatus('error')
      setMessage('Будь ласка, введіть електронну пошту')
      return
    }

    setStatus('loading')
    const result = await sendResetEmail(email)
    setStatus(result.success ? 'success' : 'error')
    setMessage(result.message)
  }

  if (status === 'success') {
    return (
      <div className="container-page pb-10 pt-6 md:pt-14">
        <Tile className="mx-auto flex w-full max-w-[440px] flex-col gap-6 p-7 text-center md:p-9">
          <div className="flex flex-col items-center gap-2">
            <div className="mb-2 grid size-14 place-items-center rounded-2xl bg-primary/15">
              <Mail className="size-7 text-primary" />
            </div>
            <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Лист надіслано!</h1>
            <p className="text-[15px] text-muted-foreground text-balance">{message}</p>
          </div>

          <div className="rounded-2xl bg-chip p-4 text-left text-sm text-soft">
            Перевірте свою поштову скриньку та папку &quot;Спам&quot;. Посилання для скидання
            паролю дійсне протягом 1 години.
          </div>

          <div className="flex flex-col gap-2.5">
            <Button asChild className="h-12 w-full rounded-2xl text-[15px]">
              <Link href="/login">Повернутися до входу</Link>
            </Button>

            <Button
              variant="secondary"
              className="h-12 w-full rounded-2xl text-[15px]"
              onClick={() => {
                setStatus('idle')
                setMessage('')
              }}
            >
              Надіслати ще раз
            </Button>
          </div>

          <Link href="/" className="text-sm font-semibold text-primary hover:opacity-90">
            ← Повернутися на головну
          </Link>
        </Tile>
      </div>
    )
  }

  return (
    <div className="container-page pb-10 pt-6 md:pt-14">
      <Tile className="mx-auto flex w-full max-w-[440px] flex-col gap-6 p-7 md:p-9">
        <div className="flex flex-col gap-2">
          <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Забули пароль?</h1>
          <p className="text-[15px] text-muted-foreground text-balance">
            Введіть свою електронну пошту і ми надішлемо вам посилання для скидання паролю
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="email">Електронна пошта</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              required
            />
          </div>

          {status === 'error' && (
            <div role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {message}
            </div>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-2xl text-[15px]"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Надсилання...' : 'Надіслати посилання'}
          </Button>
        </form>

        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-primary hover:opacity-90"
        >
          <ArrowLeft className="size-4" />
          Повернутися до входу
        </Link>
      </Tile>
    </div>
  )
}
