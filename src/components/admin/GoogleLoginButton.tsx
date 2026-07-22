'use client'
import React from 'react'
import { Button } from '@payloadcms/ui'
import Image from 'next/image'
import googleIcon from '@/icons/google-icon.svg'

export const GoogleLoginButton: React.FC = () => {
  const handleGoogleLogin = () => {
    // Same flow as the frontend login — redirect to the Google OAuth endpoint.
    // On success the callback sets the auth cookie, which is shared with the admin panel.
    // The `redirect` param tells the callback to land back on the admin panel.
    window.location.href = `/api/users/auth/google?redirect=/admin`
  }

  return (
    <Button
      buttonStyle="secondary"
      margin={false}
      onClick={handleGoogleLogin}
      size="large"
      type="button"
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Image src={googleIcon} alt="" aria-hidden width={18} height={18} />
        Увійти з Google
      </span>
    </Button>
  )
}

export default GoogleLoginButton
