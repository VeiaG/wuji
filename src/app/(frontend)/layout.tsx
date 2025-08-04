import React from 'react'
import './styles.css'
import { ThemeProvider } from '@/components/theme-provider'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { AuthProvider } from '@/providers/auth'
import LoaderProvider from '@/providers/LoaderProvider'
import Script from 'next/script'
import { UmamiUserIdentifier } from '@/components/UserIdentifier'

export const metadata = {
  description: 'ВуЧи - українська платформа для читання ранобе.',
  title: 'ВуЧи',
  openGraph: {
    title: 'ВуЧи',
    description: 'ВуЧи - українська платформа для читання ранобе.',
    images: [
      {
        url: 'https://wuji.world/og-template.jpg',
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
        <Script
          defer
          src="https://analytics.veiag.dev/script.js"
          data-website-id="0183f41b-ffe3-47cb-8c3c-8de951258cff"
          data-exclude-search="true"
        ></Script>
        <LoaderProvider>
          <AuthProvider
            // To toggle between the REST and GraphQL APIs,
            // change the `api` prop to either `rest` or `gql`
            api="rest" // change this to `gql` to use the GraphQL API
          >
            <UmamiUserIdentifier />
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
        </LoaderProvider>
      </body>
    </html>
  )
}
