'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

// Перемикач «Бенто»: 48×28, вимкнений — напівпрозора доріжка на будь-якій поверхні, увімкнений — акцент
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer group/switch inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-[3px] outline-none transition-colors duration-200',
        'data-[state=unchecked]:bg-foreground/15 data-[state=unchecked]:hover:bg-foreground/20',
        'data-[state=checked]:bg-primary data-[state=checked]:hover:bg-primary/90',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-[22px] rounded-full shadow-sm ring-0',
          'transition-[translate,background-color,width] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          'data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-foreground',
          'data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary-foreground',
          // легке «розтягування» повзунка при натисканні
          'group-active/switch:w-[26px] group-active/switch:data-[state=checked]:translate-x-4',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
