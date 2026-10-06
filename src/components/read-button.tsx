'use client'
import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { Skeleton } from './ui/skeleton'
import { useBookReadProgress } from '@/hooks/useBookReadProgress'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  bookSlug: string
}

const ReadButton: React.FC<Props> = ({ className, bookSlug }) => {
  // undefined поки не знаємо юзера/прогрес — щоб не блимало «Почати» замість «Продовжити»
  const { chapter } = useBookReadProgress(bookSlug)

  if (chapter === undefined) {
    return <Skeleton className={cn('h-[54px] rounded-2xl', className)} />
  }

  return (
    <Button asChild className={cn('h-[54px] rounded-2xl px-7 text-[17px] font-bold', className)}>
      {chapter ? (
        <Link href={`/novel/${bookSlug}/${chapter}`}>Продовжити читання</Link>
      ) : (
        <Link href={`/novel/${bookSlug}/1`}>Почати читати</Link>
      )}
    </Button>
  )
}

export default ReadButton
