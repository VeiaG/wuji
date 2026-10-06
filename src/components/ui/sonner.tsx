'use client'

import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert } from 'lucide-react'
import { Toaster as Sonner, ToasterProps } from 'sonner'

// Тости «Бенто»: плаваюча плашка кольору chip без рамки, кольорова іконка в квадратику.
// На мобільному піднімаємо над плаваючою нижньою навігацією.
const iconBox = 'grid size-8 shrink-0 place-items-center rounded-[10px]'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      gap={10}
      offset={24}
      mobileOffset={{
        bottom: 'calc(max(12px, env(safe-area-inset-bottom)) + 76px)',
        left: 12,
        right: 12,
      }}
      icons={{
        success: (
          <span className={`${iconBox} bg-primary/15 text-primary`}>
            <CircleCheck className="size-4" />
          </span>
        ),
        error: (
          <span className={`${iconBox} bg-destructive/15 text-destructive`}>
            <CircleAlert className="size-4" />
          </span>
        ),
        warning: (
          <span className={`${iconBox} bg-primary/15 text-primary`}>
            <TriangleAlert className="size-4" />
          </span>
        ),
        info: (
          <span className={`${iconBox} bg-foreground/10 text-soft`}>
            <Info className="size-4" />
          </span>
        ),
        loading: (
          <span className={`${iconBox} bg-foreground/10 text-soft`}>
            <Loader2 className="size-4 animate-spin" />
          </span>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            'group/toast !items-center !gap-3 !rounded-[18px] !border-0 !bg-chip !p-3 !pr-4 !font-sans !text-foreground !shadow-float',
          icon: '!m-0 !size-8',
          title: '!text-[14px] !font-semibold !leading-snug',
          description: '!text-[13px] !text-muted-foreground',
          actionButton:
            '!h-9 !rounded-xl !bg-primary !px-3.5 !text-[13px] !font-bold !text-primary-foreground',
          cancelButton:
            '!h-9 !rounded-xl !bg-foreground/10 !px-3.5 !text-[13px] !font-semibold !text-foreground',
          closeButton: '!border-0 !bg-tile !text-muted-foreground hover:!text-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
