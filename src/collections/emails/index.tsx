import { render } from '@react-email/components'

import VerificationEmail from '@/emails/verification-email'
import PasswordResetEmail from '@/emails/password-reset'

export const getVerificationEmailHTML = async (verificationUrl: string, userName?: string) => {
  const emailHtml = await render(
    <VerificationEmail verificationUrl={verificationUrl} userName={userName} />,
  )

  return emailHtml
}

export const getResetPasswordEmailHTML = async (resetUrl: string, userName?: string) => {
  const emailHtml = await render(<PasswordResetEmail resetUrl={resetUrl} userName={userName} />)

  return emailHtml
}
