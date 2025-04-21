import React from 'react'
import './styles.css'

import BookList from '@/components/BookList'

export default async function HomePage() {
  return (
    <div className="container mx-auto py-4">
      <h1 className="text-2xl font-bold mb-4">Усі ранобе:</h1>
      <BookList />
    </div>
  )
}
