import AccountPage from '@/components/account-page'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'
import config from '@payload-config'
import { redirect } from 'next/navigation'

const ProfilePage = async () => {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect(`/login`)
  }
  return <AccountPage />
}

export default ProfilePage
