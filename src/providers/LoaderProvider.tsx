'use client'

import { AppProgressProvider as ProgressProvider } from '@bprogress/next'

const gradientColor = 'linear-gradient(90deg, #D2691E 0%, #FF8C42 100%)'
const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProgressProvider
      height="4px"
      color={gradientColor}
      options={{ showSpinner: false }}
      shallowRouting
    >
      {/* <div
        className="fixed z-[9999] top-0 left-0 w-screen h-1"
        style={{
          background: gradientColor,
        }}
      ></div> */}
      {children}
    </ProgressProvider>
  )
}

export default LoaderProvider
