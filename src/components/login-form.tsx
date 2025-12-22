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
import { toast } from 'sonner'
import Image from 'next/image'
import googleIcon from '@/icons/google-icon.svg'

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

  const handleGoogleLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault()
    try {
      window.location.href = `/api/users/auth/google`
    } catch (err) {
      console.error(err)
      toast.error('Не вдалося увійти через Google. Будь ласка, спробуйте ще раз.')
    }
  }

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
          <Link
            href="forgot-password"
            className="mx-auto text-sm underline-offset-4 hover:underline"
          >
            Забули пароль?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Зачекайте...' : 'Увійти'}
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Або увійдіть через
          </span>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
          <Image src={googleIcon} alt="Google" width={18} height={18} />
          Увійти з Google
        </Button>
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
