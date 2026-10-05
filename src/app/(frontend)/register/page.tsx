import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RegisterForm } from '@/components/register-form'
import { Tile } from '@/components/bento'
import Image from 'next/image'

export default async function RegisterPage() {
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
          <RegisterForm />
        </Tile>
        {/* Кіт — обов'язкова частина форми */}
        <div className="relative hidden min-h-[560px] overflow-hidden rounded-tile bg-tile lg:block">
          <Image
            src="/register-preview.jpg"
            alt="Кіт"
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
