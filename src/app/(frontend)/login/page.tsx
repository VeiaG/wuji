import { LoginForm } from '@/components/login-form'
import { Tile } from '@/components/bento'
import Image from 'next/image'
import { headers as getHeaders } from 'next/headers'
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
    <div className="container-page pb-10 pt-6 md:pt-14">
      <div className="mx-auto grid w-full max-w-[440px] gap-3.5 lg:max-w-[1000px] lg:grid-cols-[440px_1fr]">
        <Tile className="w-full p-7 md:p-9">
          <LoginForm />
        </Tile>
        {/* Кіт — обов'язкова частина форми */}
        <div className="relative hidden min-h-[560px] overflow-hidden rounded-tile bg-tile lg:block">
          <Image
            src="/login-preview.jpg"
            alt="Кіт, що позіхає"
            fill
            sizes="560px"
            className="object-cover object-center"
            priority
          />
        </div>
      </div>
    </div>
  )
}
