'use client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useRouter } from '@bprogress/next/app'
import { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormInput } from './form-input'
import Link from 'next/link'
import { toast } from 'sonner'
import Image from 'next/image'
import googleIcon from '@/icons/google-icon.svg'
type FormData = {
  nickname: string
  email: string
  password: string
  passwordConfirm: string
}

export function RegisterForm({ className, ...props }: React.ComponentProps<'form'>) {
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

  const handleGoogleLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault()
    try {
      window.location.href = `/api/users/auth/google`
    } catch (err) {
      console.error(err)
      toast.error('Не вдалося зареєструватись через Google. Будь ласка, спробуйте ще раз.')
    }
  }

  const onSubmit = useCallback(
    //TODO : Maybe move to auth provider create function , or idk
    // or move this logic to auth provider instead of using auth provider register function , because it lacks functionality we need
    // e.g mail confirmation, etc.
    async (data: FormData) => {
      const response = await fetch(`/api/users`, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message: {
          errors: {
            name: string
            data: { errors: { message: string; path: string }[] }
            message?: string
          }[]
        } = await response.json()
        //Trying to catch unique nickname
        const uniqueNicknameError = message?.errors?.find(
          (err) =>
            Array.isArray(err?.data?.errors) &&
            err.data.errors.find(
              (e) => e.message === 'Значення має бути унікальним.' && e.path === 'nickname',
            ),
        )
        const generalMessage =
          message?.errors?.[0]?.message || 'Помилка реєстрації. Спробуйте ще раз.'

        setError(uniqueNicknameError ? 'Цей нікнейм вже зайнятий.' : generalMessage)
        return
      }

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        clearTimeout(timer)
        router.push(`/register/success`)
      } catch (_) {
        clearTimeout(timer)
        setError('Помилка реєстрації. Спробуйте ще раз.')
      }
    },
    [router],
  )

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      {...props}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2">
        <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Зареєструватись</h1>
        <p className="text-[15px] text-muted-foreground text-balance">
          Введіть усі дані для реєстрації нижче, щоб створити новий обліковий запис
        </p>
      </div>
      <div className="grid gap-5">
        {error && (
          <div role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
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
        <Button type="submit" className="h-12 w-full rounded-2xl text-[15px]" disabled={loading}>
          {loading ? 'Зачекайте...' : 'Зареєструватись'}
        </Button>
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Або зареєструйтесь через
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full rounded-2xl text-[15px]"
          onClick={handleGoogleLogin}
        >
          <Image src={googleIcon} alt="Google" width={18} height={18} />
          Зареєструватись з Google
        </Button>
      </div>
      <div className="text-center text-sm text-muted-foreground">
        Вже маєте аккаунт?{' '}
        <Link href="/login" className="font-semibold text-primary hover:opacity-90">
          Увійти
        </Link>
      </div>
    </form>
  )
}
