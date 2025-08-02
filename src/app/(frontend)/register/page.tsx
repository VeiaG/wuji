import { headers as getHeaders } from 'next/headers'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RegisterForm } from '@/components/register-form'

export default async function RegisterPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account`)
  }
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/register-preview.jpg"
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
