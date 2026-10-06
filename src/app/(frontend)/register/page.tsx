import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RegisterForm } from '@/components/register-form'
import { Tile } from '@/components/bento'
import { CatPeek } from '@/components/cat-peek'

export default async function RegisterPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/profile`)
  }
  return (
    <div className="overflow-x-clip">
      <div className="container-page pb-10 pt-6 md:pt-14">
        <div className="mx-auto grid w-full max-w-[440px] gap-3.5 lg:max-w-[1000px] lg:grid-cols-[440px_1fr]">
          <Tile className="w-full p-7 md:p-9">
            <RegisterForm />
          </Tile>
          {/* Кіт — обов'язкова частина форми */}
          <CatPeek
            src="/register-preview.jpg"
            alt="Кіт"
            extras={['/oskar/1.jpg', '/oskar/2.jpg', '/oskar/3.jpg']}
          />
        </div>
      </div>
    </div>
  )
}
