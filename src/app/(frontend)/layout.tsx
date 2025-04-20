import React from 'react'
import './styles.css'
import { ThemeProvider } from '@/components/theme-provider'
import Header from '@/components/header'
import Footer from '@/components/footer'

export const metadata = {
  description: 'Потім напишу)))))',
  title: 'Ranobes',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        {/* <script src="https://cdn.jsdelivr.net/npm/react-scan/dist/auto.global.js"></script> */}
        <Header />
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <main className="grow">{children}</main>
        </ThemeProvider>
        <Footer />
      </body>
    </html>
  )
}
