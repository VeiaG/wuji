'use client'
import { useAuth } from '@/providers/auth'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { ReadProgress } from '@/payload-types'
import { stringify } from 'qs-esm'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import Image from 'next/image'
import Link from 'next/link'

const ProgressCard = ({ book, page }: { book: ReadProgress['book']; page: number }) => {
  if (!book || typeof book === 'string') return null
  return (
    <Card>
      <CardContent className="flex flex-col md:flex-row gap-2">
        {typeof book.coverImage === 'object' && (
          <Image
            src={book.coverImage?.url || ''}
            alt={book.coverImage?.alt}
            width={book.coverImage?.width || 300}
            height={book.coverImage?.height || 300}
            className="rounded-lg aspect-[1/1.5] object-cover w-auto max-h-[128px] "
          />
        )}
        <div className="flex flex-col gap-2">
          <CardTitle>
            {book.title} - сторінка {page}
          </CardTitle>
          <Button variant="outline" className="mt-auto" asChild>
            <Link href={`/novel/${book.slug}/${page}`}>Продовжити читати</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const AccountPage = () => {
  const { user, logout } = useAuth()
  const [readProgresses, setReadProgress] = useState<ReadProgress[] | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchReadProgress = async () => {
      const queryString = stringify({
        where: {
          user: { equals: user.id },
        },
        select: {
          book: true,
          chapter: true,
        },
        populate: {
          books: {
            title: true,
            slug: true,
            coverImage: true,
          },
        },
        limit: 10,
      })
      const res = await fetch(`/api/readProgress?${queryString}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) {
        throw new Error('Failed to fetch read progress')
      }
      const data = await res.json()
      setReadProgress(data.docs)
    }
    fetchReadProgress()
  }, [user])

  const isLoading = !user
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1>Завантаження...</h1>
      </div>
    )
  }
  return (
    <div className="container mx-auto py-6 relative">
      <h1 className="font-bold text-3xl">{user.nickname}</h1>
      <p className="text-muted-foreground text-sm text-balance">
        Ця сторінка в розробці. UI буде кращий ( напевно )
      </p>
      <h2 className="font-bold text-2xl mt-6">Прогрес читання</h2>
      {readProgresses && readProgresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {readProgresses.map((progress) => (
            <ProgressCard
              key={progress.id}
              book={progress.book}
              page={progress.chapter || 0} // Assuming chapter has a page property
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Ви ще не прочитали жодної книги</p>
      )}
      <Button
        variant="destructive"
        onClick={() => {
          logout()
          router.push('/login')
        }}
        className="md:absolute md:top-4 md:right-4 mt-4 md:mt-0 "
      >
        Вийти з облікового запису
      </Button>
    </div>
  )
}

export default AccountPage
