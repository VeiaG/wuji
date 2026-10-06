import React from 'react'
import './styles.css'
import { ThemeProvider } from '@/components/theme-provider'
import Header from '@/components/header'
import Footer from '@/components/footer'
import MobileBottomNav from '@/components/mobile-bottom-nav'
import { AuthProvider } from '@/providers/auth'
import { SnowProvider } from '@/providers/SnowProvider'
import LoaderProvider from '@/providers/LoaderProvider'
import Script from 'next/script'
import { UmamiUserIdentifier } from '@/components/UserIdentifier'
import { LastReadPageProvider } from '@/components/LastReadPageProvider'
import { ReadProgressProvider } from '@/components/ReadProgressProvider'
import { NotificationsProvider } from '@/components/NotificationsProvider'
import { Toaster } from '@/components/ui/sonner'
import { AutoResumeHandler } from '@/components/AutoResumeHandler'
import { TokenRefresh } from '@/components/TokenRefresh'
import { SearchDialogProvider } from '@/components/search-dialog'
import { BannerWrapper } from '@/components/banner'
import { Onest, Unbounded } from 'next/font/google'
import { DEFAULT_PALETTE, PALETTE_STORAGE_KEY, palettes } from '@/lib/palettes'
import { cn } from '@/lib/utils'

const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-onest',
  display: 'swap',
})

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['700', '800'],
  variable: '--font-unbounded',
  display: 'swap',
})

export const metadata = {
  description: 'ВуЧи - українська платформа для читання ранобе.',
  title: 'ВуЧи',
  openGraph: {
    title: 'ВуЧи',
    description: 'ВуЧи - українська платформа для читання ранобе.',
    images: [
      {
        url: 'https://wuji.world/og',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="uk" className={cn('dark', onest.variable, unbounded.variable)} suppressHydrationWarning>
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
            <ReadProgressProvider>
              <NotificationsProvider>
              <LastReadPageProvider>
                <UmamiUserIdentifier />
                <Toaster />
                <AutoResumeHandler />
                <TokenRefresh />

              <ThemeProvider
                attribute="data-palette"
                themes={palettes.map((palette) => palette.id)}
                defaultTheme={DEFAULT_PALETTE}
                storageKey={PALETTE_STORAGE_KEY}
                enableSystem={false}
                enableColorScheme={false}
                disableTransitionOnChange
              >
                <SnowProvider>
                  <SearchDialogProvider>
                    <BannerWrapper />
                    <Header />
                    <main className="grow">{children}</main>
                    <Footer />
                    <MobileBottomNav />
                  </SearchDialogProvider>
                </SnowProvider>
              </ThemeProvider>
              </LastReadPageProvider>
              </NotificationsProvider>
            </ReadProgressProvider>
          </AuthProvider>
        </LoaderProvider>
      </body>
    </html>
  )
}
