import React from 'react'
import './styles.css'
import { ThemeProvider } from '@/components/theme-provider'
import Header from '@/components/header'
import Footer from '@/components/footer'
import MobileBottomNav from '@/components/mobile-bottom-nav'
import { AuthProvider } from '@/providers/auth'
import LoaderProvider from '@/providers/LoaderProvider'
import Script from 'next/script'
import { UmamiUserIdentifier } from '@/components/UserIdentifier'
import { LastReadPageProvider } from '@/components/LastReadPageProvider'
import { Toaster } from '@/components/ui/sonner'
import { AutoResumeHandler } from '@/components/AutoResumeHandler'
import { SearchDialogProvider } from '@/components/search-dialog'

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
    <html lang="uk" suppressHydrationWarning>
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
            <LastReadPageProvider>
              <UmamiUserIdentifier />
              <Toaster />
              <AutoResumeHandler />

              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                disableTransitionOnChange
                enableSystem
              >
                <SearchDialogProvider>
                  <Header />
                  <main className="grow">{children}</main>
                  <Footer />
                  <MobileBottomNav />
                </SearchDialogProvider>
              </ThemeProvider>
            </LastReadPageProvider>
          </AuthProvider>
        </LoaderProvider>
      </body>
    </html>
  )
}
