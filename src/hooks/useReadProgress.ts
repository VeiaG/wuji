'use client'

import { useState, useEffect, useCallback } from 'react'

export interface BookProgress {
  bookId: string
  bookSlug: string
  chapter: number
  title: string
  timestamp: number
}

const STORAGE_KEY = 'last-read-page'

// Helper functions for localStorage (just last page)
const getLastPageFromStorage = (): BookProgress | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return {
      bookId: '', // We don't store bookId in old format
      bookSlug: parsed.slug,
      chapter: parseInt(parsed.page),
      title: parsed.title,
      timestamp: parsed.timestamp,
    }
  } catch {
    return null
  }
}

const saveLastPageToStorage = (bookSlug: string, chapter: number, title: string): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        slug: bookSlug,
        page: chapter.toString(),
        timestamp: Date.now(),
        title,
      }),
    )
  } catch (error) {
    console.error('Failed to save progress to localStorage:', error)
  }
}

export interface UseReadProgressReturn {
  // Save progress for a book
  saveProgress: (bookId: string, bookSlug: string, chapter: number, title: string) => Promise<void>

  // Get the last read book (from API if authenticated, localStorage otherwise)
  getLastRead: () => Promise<BookProgress | null>

  // Clear progress for a specific book (API only)
  clearProgress: (bookId: string) => Promise<void>
}

export function useReadProgress(userId?: string): UseReadProgressReturn {
  // Save progress (to API if authenticated, always to localStorage)
  const saveProgress = useCallback(
    async (bookId: string, bookSlug: string, chapter: number, title: string) => {
      // Always update localStorage for quick access
      saveLastPageToStorage(bookSlug, chapter, title)

      // If user is authenticated, also update API
      if (userId) {
        try {
          // Check if progress exists
          const checkRes = await fetch(
            `/api/readProgress?where[user][equals]=${userId}&where[book][equals]=${bookId}&limit=1`,
          )
          const checkData = await checkRes.json()
          const existing = checkData.docs?.[0]

          if (existing && existing.chapter < chapter) {
            // Update if new chapter is greater
            await fetch(`/api/readProgress/${existing.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chapter }),
            })
          } else if (!existing) {
            // Create new
            await fetch('/api/readProgress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user: userId,
                book: bookId,
                chapter,
              }),
            })
          }
        } catch (error) {
          console.error('Failed to save progress to API:', error)
        }
      }
    },
    [userId],
  )

  // Get the last read book
  const getLastRead = useCallback(async (): Promise<BookProgress | null> => {
    // If user is authenticated, fetch from API
    if (userId) {
      try {
        const res = await fetch(
          `/api/readProgress?where[user][equals]=${userId}&limit=1&sort=-updatedAt&depth=1`,
        )
        const data = await res.json()
        const latest = data.docs?.[0]

        if (latest) {
          const book = typeof latest.book === 'string' ? null : latest.book
          return {
            bookId: typeof latest.book === 'string' ? latest.book : latest.book?.id || '',
            bookSlug: book?.slug || '',
            chapter: latest.chapter,
            title: book?.title || '',
            timestamp: new Date(latest.updatedAt).getTime(),
          }
        }
      } catch (error) {
        console.error('Failed to fetch last read from API:', error)
      }
    }

    // Fallback to localStorage
    return getLastPageFromStorage()
  }, [userId])

  // Clear progress for a specific book
  const clearProgress = useCallback(
    async (bookId: string) => {
      // If user is authenticated, delete from API
      if (userId) {
        try {
          const checkRes = await fetch(
            `/api/readProgress?where[user][equals]=${userId}&where[book][equals]=${bookId}&limit=1`,
          )
          const checkData = await checkRes.json()
          const existing = checkData.docs?.[0]

          if (existing) {
            await fetch(`/api/readProgress/${existing.id}`, {
              method: 'DELETE',
            })
          }
        } catch (error) {
          console.error('Failed to delete progress from API:', error)
        }
      }
    },
    [userId],
  )

  return {
    saveProgress,
    getLastRead,
    clearProgress,
  }
}
