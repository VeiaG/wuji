import { LoginForm } from '@/components/login-form'
import { Tile } from '@/components/bento'
import { CatPeek } from '@/components/cat-peek'
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
    <div className="overflow-x-clip">
      <div className="container-page pb-10 pt-6 md:pt-14">
        <div className="mx-auto grid w-full max-w-[440px] gap-3.5 lg:max-w-[1000px] lg:grid-cols-[440px_1fr]">
          <Tile className="w-full p-7 md:p-9">
            <LoginForm />
          </Tile>
          {/* Кіт — обов'язкова частина форми */}
          <CatPeek
            src="/login-preview.jpg"
            alt="Кіт, що позіхає"
            extras={['/aska/1.jpg', '/aska/2.jpg', '/aska/3.jpg']}
          />
        </div>
      </div>
    </div>
  )
}
