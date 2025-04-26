import { LoginForm } from '@/components/login-form'
import { headers as getHeaders } from 'next/headers'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function LoginPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/profile`)
  }
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/login-preview.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover object-center"
          width={0}
          height={0}
          sizes="100vh"
        />
      </div>
    </div>
  )
}
