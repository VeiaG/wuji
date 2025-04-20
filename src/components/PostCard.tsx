import { Media } from '@/payload-types'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { ArrowRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

type BlogCardProps = {
  title: string
  description: string
  image: string | Media
  slug: string
  publishedAt: string
  hideImage?: boolean
  className?: string
  isOnHomepage?: boolean
}
const BlogCard = ({
  title,
  description,
  image,
  slug,
  publishedAt,
  hideImage = false,
  isOnHomepage = false,
  className,
}: BlogCardProps) => {
  return (
    <Card className={cn(` ${hideImage ? '' : 'pt-0'}`, className)}>
      {!hideImage && (
        <div
          className={cn(
            'relative  h-auto w-full rounded-xl rounded-b-none aspect-video',
            isOnHomepage ? 'grow' : '',
          )}
        >
          <Image
            src={(typeof image === 'string' ? image : image.url) || ''}
            alt={(image as Media)?.alt || title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardContent className={cn('flex flex-col', isOnHomepage ? '' : 'h-full')}>
        <div className="text-zinc-50/60 flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {new Date(publishedAt).toLocaleDateString('uk-UA')}
        </div>
        {/* <NoiseOverlay className="z-0" /> */}

        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-md font-light ">{description}</p>
        <Button
          asChild
          variant={'link'}
          className="ml-auto mt-auto self-end flex items-center gap-2 flex-row"
        >
          <Link className="relative flex flex-col gap-0.5" href={`/blog/${slug}`}>
            Прочитати <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default BlogCard
