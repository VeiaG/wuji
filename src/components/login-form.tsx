'use client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useRouter } from '@bprogress/next/app'
import { useSearchParams } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { useAuth } from '@/providers/auth'
import { useForm } from 'react-hook-form'
import { FormInput } from './form-input'
import Link from 'next/link'

type FormData = {
  email: string
  password: string
}

export function LoginForm({ className, ...props }: React.ComponentProps<'form'>) {
  const searchParams = useSearchParams()
  // const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const redirect = useRef(searchParams.get('redirect'))
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<null | string>(null)

  const {
    formState: { errors, isLoading },
    handleSubmit,
    register,
  } = useForm<FormData>({})

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        await login(data)
        if (redirect?.current) {
          router.push(redirect.current)
        } else {
          router.push('/')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Виникла помилка з наданими обліковими даними. Будь ласка, спробуйте ще раз.'
        setError(errorMessage)
      }
    },
    [login, router],
  )

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      {...props}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Увійдіть до свого аккаунту</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Введіть свою електронну пошту нижче, щоб увійти до свого облікового запису
        </p>
      </div>
      <div className="grid gap-6">
        {error && <div className="text-destructive">{error}</div>}
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Зачекайте...' : 'Увійти'}
        </Button>
        <Link href="forgot-password" className="mx-auto text-sm underline-offset-4 hover:underline">
          Забули пароль?
        </Link>
        {/* <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Або увійдіть через
          </span>
        </div>
        <Button variant="outline" className="w-full" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              fill="currentColor"
            />
          </svg>
          (колись зроблю інший вхід)
        </Button> */}
      </div>
      <div className="text-center text-sm">
        Не маєте аккаунту?{' '}
        <Link href="/register" className="underline underline-offset-4">
          Зареєструватись
        </Link>
      </div>
    </form>
  )
}
