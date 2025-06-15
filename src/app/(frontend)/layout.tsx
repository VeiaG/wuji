import React from 'react'
import './styles.css'
import { ThemeProvider } from '@/components/theme-provider'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { AuthProvider } from '@/providers/auth'

export const metadata = {
  description: 'ВуЧи - українська платформа для читання ранобе.',
  title: 'ВуЧи',
  openGraph: {
    title: 'ВуЧи',
    description: 'ВуЧи - українська платформа для читання ранобе.',
    images: [
      {
        url: 'https://ranobes.veiag.dev/og-template.jpg',
      },
    ],
    type: 'website',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <AuthProvider
          // To toggle between the REST and GraphQL APIs,
          // change the `api` prop to either `rest` or `gql`
          api="rest" // change this to `gql` to use the GraphQL API
        >
          {/* <script src="https://cdn.jsdelivr.net/npm/react-scan/dist/auto.global.js"></script> */}

          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
            enableSystem
          >
            <Header />
            <main className="grow">{children}</main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
