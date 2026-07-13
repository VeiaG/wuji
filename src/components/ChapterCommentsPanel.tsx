'use client'

import { X } from 'lucide-react'
import Comments from './comments'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer'
import { useMediaQuery } from '@/hooks/useMediaQuery'

type Props = {
  chapterID: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Панель коментарів для колонкового (paginated) режиму читання.
 * На ПК висувається збоку (як sheet), на мобілці — знизу з drag-жестом (Vaul).
 * Оверлей та контент підняті над рідером (`z-[200]`).
 */
export default function ChapterCommentsPanel({ chapterID, open, onOpenChange }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const direction = isDesktop ? 'right' : 'bottom'

  return (
    // key by direction so a breakpoint change cleanly reinitializes Drawer.Root
    <Drawer key={direction} open={open} onOpenChange={onOpenChange} direction={direction}>
      <DrawerContent
        overlayClassName="z-[290]"
        className="z-[300] data-[vaul-drawer-direction=bottom]:max-h-[85vh]"
      >
        <DrawerHeader className="relative border-b py-3 text-left">
          <DrawerTitle>Коментарі</DrawerTitle>
          <DrawerDescription className="sr-only">
            Коментарі до цього розділу
          </DrawerDescription>
          <DrawerClose
            aria-label="Закрити коментарі"
            className="ring-offset-background focus:ring-ring absolute top-1/2 right-4 -translate-y-1/2 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
          >
            <X className="size-4" />
            <span className="sr-only">Закрити</span>
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          <Comments chapterID={chapterID} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
