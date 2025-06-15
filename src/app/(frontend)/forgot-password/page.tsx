'use client'

import type React from 'react'

import { useState } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">Лист надіслано!</h1>
            <p className="text-muted-foreground">{message}</p>
          </div>

          <Alert className="mb-6">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Перевірте свою поштову скриньку та папку &quot;Спам&quot;. Посилання для скидання
              паролю дійсне протягом 1 години.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Повернутися до входу</Link>
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStatus('idle')
                setMessage('')
              }}
            >
              Надіслати ще раз
            </Button>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Повернутися на головну
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Забули пароль?</h1>
          <p className="text-muted-foreground">
            Введіть свою електронну пошту і ми надішлемо вам посилання для скидання паролю
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Alert className="border-destructive/20 bg-destructive/5">
              <AlertDescription className="text-destructive">{message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Надсилання...' : 'Надіслати посилання'}
          </Button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Повернутися до входу
          </Link>
        </div>
      </div>
    </div>
  )
}
