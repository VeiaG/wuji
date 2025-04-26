'use client'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { Skeleton } from './ui/skeleton'
import { useAuth } from '@/providers/auth'
import { stringify } from 'qs-esm'

type Props = {
  className?: string
  bookSlug: string
}

const ReadButton: React.FC<Props> = ({ className, bookSlug }) => {
  const [lastReadChapter, setLastReadChapter] = useState<string | null>(null)
  // боже який ужас)) три state-а для завантаження
  /*
  isClient - для того, щоб не рендерити компонент на сервері, поки не завантажився ( для пререндерингу )
  isUserLoaded - для того, щоб не рендерити компонент поки не завантажився юзер (щоб не показувати почати читати, якщо юзер все ж авторизований)
  isProgressLoading - для того, щоб не рендерити компонент поки не завантажився прогрес читання (щоб не показувати кнопку "продовжити читання", якщо юзер все ж авторизований)
  */
  const [isClient, setIsClient] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  const [isProgressLoading, setIsProgressLoading] = useState(false)
  const { user } = useAuth()
  useEffect(() => {
    if (user === undefined) return // ще не знаємо чи є юзер
    setIsUserLoaded(true)
  }, [user])
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!user) return

    //read progress is saved in DB
    const fetchReadProgress = async () => {
      setIsProgressLoading(true)
      try {
        const query = stringify({
          where: { 'book.slug': { equals: bookSlug }, user: { equals: user.id } },
          select: { chapter: true },
          limit: 1,
        })

        const req = await fetch(`/api/readProgress?${query}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await req.json()
        if (data && data?.docs?.[0]) {
          setLastReadChapter(data.docs[0].chapter)
        }
      } catch (err) {
        console.error('Failed to fetch read progress:', err)
      } finally {
        setIsProgressLoading(false) // завантаження завершено
      }
    }
    fetchReadProgress()
  }, [bookSlug, user])
  if (!isClient || !isUserLoaded || (user && isProgressLoading))
    return (
      <div className={className}>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  return (
    <div className={className}>
      {lastReadChapter ? (
        <Button asChild className="mb-2 w-full">
          <Link href={`/novel/${bookSlug}/${lastReadChapter}`}>Продовжити читання</Link>
        </Button>
      ) : (
        <Button asChild className="w-full">
          <Link href={`/novel/${bookSlug}/1`}>Почати читати</Link>
        </Button>
      )}
    </div>
  )
}

export default ReadButton
