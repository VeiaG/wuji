import { FeaturedBookBlock } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import RichText from '@/components/RichText'
import { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import BlockBackground from './BlockBackground'

const FeaturedBookBlockComponent: React.FC<FeaturedBookBlock> = ({
  label,
  book,
  customDescription,
  buttonLabel,
}) => {
  if (typeof book === 'string') return null

  const cover = typeof book.coverImage === 'object' ? book.coverImage : null

  return (
    <section className="relative overflow-hidden py-12 border-b border-border/20">
      <BlockBackground image={book.coverImage} />
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start max-w-4xl mx-auto">
          {cover && (
            <Link href={`/novel/${book.slug}`} className="flex-shrink-0">
              <Image
                src={cover.url || ''}
                alt={cover.alt || book.title}
                width={cover.width || 300}
                height={cover.height || 450}
                className="rounded-lg aspect-[1/1.5] object-cover w-48 md:w-56 shadow-lg"
              />
            </Link>
          )}
          <div className="flex flex-col gap-4 text-center md:text-left items-center md:items-start">
            {label && (
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                {label}
              </span>
            )}
            <Link href={`/novel/${book.slug}`}>
              <h2 className="text-3xl md:text-4xl font-bold hover:underline">{book.title}</h2>
            </Link>
            {book.genres && book.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                {book.genres.slice(0, 5).map((genre) => {
                  if (typeof genre === 'string') return null
                  return (
                    <Badge key={genre.id} variant="outline">
                      {genre.title}
                    </Badge>
                  )
                })}
              </div>
            )}
            {customDescription ? (
              <p className="text-muted-foreground leading-relaxed line-clamp-4">
                {customDescription}
              </p>
            ) : (
              book.description && (
                <RichText
                  data={book.description as DefaultTypedEditorState}
                  className="text-muted-foreground leading-relaxed line-clamp-4"
                />
              )
            )}
            <Button asChild size="lg" className="mt-2">
              <Link href={`/novel/${book.slug}`}>
                <BookOpen className="h-4 w-4" />
                {buttonLabel || 'Читати'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedBookBlockComponent
