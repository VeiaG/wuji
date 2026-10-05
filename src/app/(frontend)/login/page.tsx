import { LoginForm } from '@/components/login-form'
import { Tile } from '@/components/bento'
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
      <Tile className="mx-auto w-full max-w-[440px] p-7 md:p-9">
        <LoginForm />
      </Tile>
    </div>
  )
}
