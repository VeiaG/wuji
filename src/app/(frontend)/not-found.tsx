import { Button } from '@/components/ui/button'
import { Tile } from '@/components/bento'
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

const NotFound = () => {
  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <Tile className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4 px-6 py-12 text-center md:px-12 md:py-16">
        <Image
          src="/not_found.webp"
          alt="404 — кіт не знайшов сторінку"
          width={220}
          height={220}
          className="size-[180px] rounded-2xl object-contain md:size-[220px]"
          priority
        />
        <span className="font-display text-[72px] font-extrabold leading-none tracking-tight text-primary md:text-[96px]">
          404
        </span>
        <h1 className="heading-display text-[24px] md:text-[30px]">Сторінку не знайдено</h1>
        <p className="max-w-[420px] text-[15px] leading-relaxed text-soft md:text-base">
          Вибачте, але сторінку, яку ви шукаєте, не знайдено. Перевірте URL або поверніться на
          головну сторінку.
        </p>
        <Button className="mt-2 h-12 rounded-2xl px-7 text-base" asChild>
          <Link href="/">На головну</Link>
        </Button>
      </Tile>
    </div>
  )
}

export default NotFound
