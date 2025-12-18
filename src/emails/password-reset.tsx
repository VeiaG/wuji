import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'

interface PasswordResetEmailProps {
  resetUrl: string
  userName?: string
}

export default function PasswordResetEmail({ resetUrl, userName }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Скидання паролю для вашого акаунта ВуЧи</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              fontFamily: {
                sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
              },
            },
          },
        }}
      >
        <Body className="bg-muted font-sans">
          <Container className="mx-auto my-8 max-w-lg rounded-xl bg-background px-6 py-8 shadow-lg">
            <Link href="https://wuji.world/" className="text-2xl font-bold no-underline text-black">
              ВуЧи
            </Link>

            <Section className="mt-6">
              <Text className="text-xl font-semibold text-black">Скидання паролю</Text>

              <Text className="mt-2 text-sm leading-6 text-muted-foreground">
                Привіт{userName ? `, ${userName}` : ''}! Ви отримали цей лист, оскільки хтось
                (можливо, ви) надіслав запит на скидання паролю для акаунта ВуЧи.
              </Text>

              <Section className="mt-6 text-center">
                <Button
                  href={resetUrl}
                  className="rounded-md bg-black text-white px-6 py-3 text-sm font-medium shadow"
                >
                  Скинути пароль
                </Button>
              </Section>

              <Text className="mt-6 text-xs leading-5 text-muted-foreground">
                Якщо кнопка не працює, скопіюйте та вставте це посилання у ваш браузер:
              </Text>
              <Link href={resetUrl} className="break-all text-xs text-primary underline">
                {resetUrl}
              </Link>

              <Text className="mt-8 text-xs leading-5 text-muted-foreground">
                Якщо ви не надсилали запит на скидання паролю, просто проігноруйте цей лист.
              </Text>

              <Text className="mt-4 text-xs leading-5 text-muted-foreground">
                З найкращими побажаннями,
                <br />
                Команда ВуЧи
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
