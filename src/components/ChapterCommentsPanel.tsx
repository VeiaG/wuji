'use client'

import Comments from './comments'
import {
  Drawer,
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

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isDesktop ? 'right' : 'bottom'}
    >
      <DrawerContent
        overlayClassName="z-[290]"
        className="z-[300] data-[vaul-drawer-direction=bottom]:max-h-[85vh]"
      >
        <DrawerHeader className="border-b py-3 text-left">
          <DrawerTitle>Коментарі</DrawerTitle>
          <DrawerDescription className="sr-only">
            Коментарі до цього розділу
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          <Comments chapterID={chapterID} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
