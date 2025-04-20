'use client'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { Skeleton } from './ui/skeleton'

type Props = {
  className?: string
  bookSlug: string
}

const ReadButton: React.FC<Props> = ({ className, bookSlug }) => {
  const [lastReadChapter, setLastReadChapter] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const progress = localStorage.getItem('readingProgress')
      if (progress) {
        const parsed = JSON.parse(progress)
        if (parsed[bookSlug]) {
          setLastReadChapter(parsed[bookSlug])
        }
      }
    }
  }, [bookSlug])

  const resetProgress = () => {
    if (typeof window !== 'undefined') {
      const progress = localStorage.getItem('readingProgress')
      if (progress) {
        const parsed = JSON.parse(progress)
        delete parsed[bookSlug]
        localStorage.setItem('readingProgress', JSON.stringify(parsed))
      }
      setLastReadChapter(null)
    }
  }
  if (!isClient)
    return (
      <div className={className}>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  return (
    <div className={className}>
      {lastReadChapter ? (
        <>
          <Button asChild className="mb-2 w-full">
            <Link href={`/novel/${bookSlug}/${lastReadChapter}`}>Продовжити читання</Link>
          </Button>
          <Button variant="secondary" onClick={resetProgress} className="w-full">
            Почати з початку
          </Button>
        </>
      ) : (
        <Button asChild className="w-full">
          <Link href={`/novel/${bookSlug}/1`}>Почати читати</Link>
        </Button>
      )}
    </div>
  )
}

export default ReadButton
