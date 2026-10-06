'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tile } from '@/components/bento'
import Link from 'next/link'
import { useAuth } from '@/providers/auth'

type ResetStatus = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'invalid'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<ResetStatus>('loading')
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { resetPassword } = useAuth()

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      setMessage('Відсутній токен скидання паролю')
      return
    } else {
      setStatus('ready')
      setMessage('Будь ласка, введіть новий пароль')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      setStatus('error')
      setMessage('Будь ласка, заповніть всі поля')
      return
    }

    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Паролі не співпадають')
      return
    }

    if (password.length < 8) {
      setStatus('error')
      setMessage('Пароль повинен містити мінімум 8 символів')
      return
    }

    setStatus('submitting')
    try {
      await resetPassword({
        password: password,
        passwordConfirm: confirmPassword,
        token: token || '',
      })

      setStatus('success')
      setMessage('Пароль успішно змінено! ')
    } catch (error) {
      setStatus('error')
      let errorMessage = error instanceof Error ? error.message : 'Помилка скидання паролю'
      if (errorMessage === 'Token is either invalid or has expired.') {
        errorMessage =
          'Токен недійсний або термін його дії закінчився. Будь ласка, запросість нове посилання для скидання паролю.'
      }
      setMessage(errorMessage)
    }
  }

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
            <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Перевірка посилання</h1>
            <p className="text-[15px] text-muted-foreground">Будь ласка, зачекайте...</p>
          </div>
        )

      case 'ready':
      case 'submitting':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Створити новий пароль</h1>
              <p className="text-[15px] text-muted-foreground text-balance">
                Введіть новий пароль для вашого облікового запису
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label htmlFor="password">Новий пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введіть новий пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === 'submitting'}
                    className="pr-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={status === 'submitting'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <Eye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Підтвердіть пароль</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Підтвердіть новий пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={status === 'submitting'}
                    className="pr-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={status === 'submitting'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <Eye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-2xl text-[15px]"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Зміна паролю...' : 'Змінити пароль'}
              </Button>
            </form>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col items-center gap-2 text-center">
            {iconBox(<CheckCircle className="size-7 text-primary" />)}
            <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Пароль змінено!</h1>
            <p className="text-[15px] text-muted-foreground">{message}</p>

            <div className="mt-4 w-full rounded-2xl bg-chip p-4 text-left text-sm text-soft">
              Ви вже увійшли до свого акаунту. Якщо це не так —{' '}
              <Link href="/login" className="font-semibold text-primary hover:opacity-90">
                увійдіть з новим паролем
              </Link>
              .
            </div>
          </div>
        )

      case 'error':
      case 'invalid':
        return (
          <div className="flex flex-col items-center gap-2 text-center">
            {iconBox(<XCircle className="size-7 text-destructive" />, true)}
            <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Помилка скидання паролю</h1>
            <p className="text-[15px] text-muted-foreground text-balance">{message}</p>

            <div className="mt-4 flex w-full flex-col gap-2.5">
              <Button asChild className="h-12 w-full rounded-2xl text-[15px]">
                <Link href="/forgot-password">Запросити нове посилання</Link>
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
