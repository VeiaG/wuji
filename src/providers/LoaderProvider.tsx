'use client'

import { AppProgressProvider as ProgressProvider } from '@bprogress/next'

const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProgressProvider
      height="4px"
      color="linear-gradient(90deg, #FF29C3 0%, #174AFF 100%)"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  )
}

export default LoaderProvider
