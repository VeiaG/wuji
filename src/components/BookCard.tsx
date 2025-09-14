import { BookGenre, Media } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'

export const BookCard: React.FC<{
  book: {
    id: string
    title: string
    coverImage: string | Media
    genres: (string | BookGenre)[]
    slug?: string | null | undefined
  }
}> = ({ book }) => {
  return (
    <Link href={`/novel/${book.slug}`} className="flex flex-col gap-2">
      {typeof book.coverImage === 'object' && (
        <Image
          src={book.coverImage?.url || ''}
          alt={book.coverImage?.alt || ''}
          width={book.coverImage?.width || 300}
          height={book.coverImage?.height || 300}
          className="rounded-lg aspect-[1/1.5] object-cover w-full max-w-[350px]"
        />
      )}
      <h2 className="text-xl font-bold">{book.title}</h2>
      <div className=" gap-2 flex-wrap hidden md:flex">
        {book.genres?.slice(0, 3)?.map((genre) => {
          if (typeof genre === 'string') return null
          return (
            <Badge key={genre.id} className="text-sm" variant="outline">
              {genre.title}
            </Badge>
          )
        })}
        {book.genres && book.genres.length > 3 ? (
          <Badge key="more" className="text-sm" variant="outline">
            +{book.genres.length - 3}
          </Badge>
        ) : null}
      </div>
    </Link>
  )
}
