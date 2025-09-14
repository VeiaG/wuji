import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const NotFound = () => {
  return (
    <div className="container mx-auto py-6 px-4 flex flex-col items-center justify-center min-h-[720px] text-center">
      <Image src="/not_found.webp" alt="404 Not Found" width={256} height={256} className="mb-2" />
      <h1 className="text-3xl font-bold mb-4">Ехх, Сторінку не знайдено</h1>
      <p className="text-lg">Вибачте, але сторінку, яку ви шукаєте, не знайдено.</p>
      <p className="text-lg">Перевірте URL або поверніться на головну сторінку.</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/">Повернутися на головну</Link>
      </Button>
    </div>
  )
}

export default NotFound
