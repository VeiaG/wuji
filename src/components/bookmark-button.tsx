'use client'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { useAuth } from '@/providers/auth'
import { stringify } from 'qs-esm'
import { Heart, Loader2 } from 'lucide-react'

type Props = {
  className?: string
  bookID?: string
}

const BookmarkButton: React.FC<Props> = ({ bookID }) => {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (!bookID) return // якщо bookID не передано, нічого не робимо
    //read progress is saved in DB
    const fetchBookmarked = async () => {
      setIsBookmarkLoading(true)
      try {
        const query = stringify({
          where: {
            user: { equals: user.id },
            book: { equals: bookID },
          },
          select: { chapter: true },
          limit: 1,
        })

        const req = await fetch(`/api/bookmarks?${query}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await req.json()
        if (data && data?.docs?.[0]) {
          setIsBookmarked(true)
        }
      } catch (err) {
        console.error('Failed to fetch bookmarked status:', err)
        setIsBookmarked(false)
      } finally {
        setIsBookmarkLoading(false) // завантаження завершено
      }
    }
    fetchBookmarked()
  }, [bookID, user])

  const handleChangeBookmarkStatus = async () => {
    if (!user) return // юзер не авторизований, нічого не робимо
    setIsBookmarkLoading(true)
    try {
      if (isBookmarked) {
        // Якщо вже є закладка, то видаляємо її
        const query = stringify({
          where: {
            user: { equals: user.id },
            book: { equals: bookID },
          },
        })
        const req = await fetch(`/api/bookmarks?${query}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!req.ok) {
          throw new Error('Failed to delete bookmark')
        }
        setIsBookmarked(false)
      } else {
        // Якщо немає закладки, то додаємо її
        const req = await fetch(`/api/bookmarks`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            book: bookID, // передаємо ID книги для створення закладки
            user: user.id, // передаємо ID користувача для створення закладки
          }),
        })
        if (!req.ok) {
          throw new Error('Failed to add bookmark')
        }
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsBookmarkLoading(false)
    }
  }
  if (user === undefined || isBookmarkLoading)
    return (
      <Button variant="outline" size="icon" disabled>
        <Loader2 className="animate-spin" />
      </Button>
    )

  return (
    <Button
      variant="outline"
      size="icon"
      disabled={user === null}
      onClick={handleChangeBookmarkStatus}
    >
      <Heart
        className={`${isBookmarked ? 'text-red-500' : 'text-gray-400'}`}
        fill={isBookmarked ? 'currentColor' : 'none'}
      />
    </Button>
  )
}

export default BookmarkButton
