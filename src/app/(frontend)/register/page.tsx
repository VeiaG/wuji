import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RegisterForm } from '@/components/register-form'
import { Tile } from '@/components/bento'

export default async function RegisterPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account`)
  }
  return (
    <div className="container-page pb-10 pt-6 md:pt-14">
      <Tile className="mx-auto w-full max-w-[440px] p-7 md:p-9">
        <RegisterForm />
      </Tile>
    </div>
  )
}
