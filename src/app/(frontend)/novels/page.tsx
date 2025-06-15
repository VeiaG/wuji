import React from 'react'
import BookList from '@/components/BookList'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default async function HomePage() {
  return (
    <div className="container mx-auto py-4">
      <div className="relative mb-6">
        <Input placeholder="Пошук ранобе" className="pl-8" disabled />
        <Search className="absolute left-1 top-3 h-4 w-6 text-muted" />
      </div>
      <h1 className="text-2xl font-bold mb-4">Усі ранобе:</h1>
      <BookList />
    </div>
  )
}
