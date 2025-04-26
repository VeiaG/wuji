'use client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { useAuth } from '@/providers/auth'
import { useForm } from 'react-hook-form'
import { FormInput } from './form-input'
import Link from 'next/link'

type FormData = {
  nickname: string
  email: string
  password: string
  passwordConfirm: string
}

export function RegisterForm({ className, ...props }: React.ComponentProps<'form'>) {
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<null | string>(null)
  const [loading, setLoading] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(`/api/users`, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message = response.statusText || 'Помилка реєстрації. Спробуйте ще раз.'
        setError(message)
        return
      }

      const redirect = searchParams.get('redirect')

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        await login(data)
        clearTimeout(timer)
        if (redirect) {
          router.push(redirect)
        } else {
          router.push(`/`)
        }
      } catch (_) {
        clearTimeout(timer)
        setError('Помилка реєстрації. Спробуйте ще раз.')
      }
    },
    [login, router, searchParams],
  )

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      {...props}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Зареєструватись</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Введіть усі дані для реєстрації нижче, щоб створити новий обліковий запис
        </p>
      </div>
      <div className="grid gap-6">
        {error && <div className="text-destructive">{error}</div>}
        <div className="grid gap-3">
          <FormInput
            name="nickname"
            label="Нікнейм"
            type="text"
            register={register}
            required
            error={errors.nickname}
            validate={(value) => {
              if (value.length < 3) {
                return 'Нікнейм повинен містити не менше 3 символів'
              }
              if (value.length > 20) {
                return 'Нікнейм повинен містити не більше 20 символів'
              }
              return true
            }}
          />
        </div>
        <div className="grid gap-3">
          <FormInput
            name="email"
            label="Email"
            type="email"
            register={register}
            required
            error={errors.email}
          />
        </div>
        <div className="grid gap-3">
          <FormInput
            name="password"
            label="Пароль"
            type="password"
            register={register}
            required
            error={errors.password}
          />
        </div>
        <div className="grid gap-3">
          <FormInput
            error={errors.passwordConfirm}
            name="passwordConfirm"
            label="Підтвердження пароля"
            type="password"
            register={register}
            required
            validate={(value) => value === password.current || 'Паролі не співпадають'}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Зачекайте...' : 'Зареєструватись'}
        </Button>
        <a href="#" className="mx-auto text-sm underline-offset-4 hover:underline">
          Забули пароль?
        </a>
      </div>
      <div className="text-center text-sm">
        Вже маєте аккаунт?{' '}
        <Link href="/login" className="underline underline-offset-4">
          Увійти
        </Link>
      </div>
    </form>
  )
}
