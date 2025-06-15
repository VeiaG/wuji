'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Перевірка посилання</h1>
            <p className="text-muted-foreground">Будь ласка, зачекайте...</p>
          </div>
        )

      case 'ready':
      case 'submitting':
        return (
          <div>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Створити новий пароль</h1>
              <p className="text-muted-foreground">
                Введіть новий пароль для вашого облікового запису
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
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
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Зміна паролю...' : 'Змінити пароль'}
              </Button>
            </form>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">Пароль змінено!</h1>
            <p className="text-muted-foreground mb-6">{message}</p>

            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <p>
                  Ви вже увійшли до свого акаунту. Якщо це не так —{' '}
                  <Link href="/login" className="underline text-primary inline">
                    увійдіть з новим паролем
                  </Link>
                  .
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )

      case 'error':
      case 'invalid':
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Помилка скидання паролю</h1>
            <p className="text-muted-foreground mb-6">{message}</p>

            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/forgot-password">Запросити нове посилання</Link>
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
