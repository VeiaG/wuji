import SearchInput from '@/components/searchInput'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { extractPlainText } from '@/lib/extractPlainText'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams?: Promise<{
    search?: string
  }>
}
const payload = await getPayload({ config: config })
const EditorPage: React.FC<Args> = async ({ params, searchParams }) => {
  const { slug = '' } = await params
  const { search = '' } = (await searchParams) || {}
  if (!search) {
    return (
      <div className="container mx-auto py-4 md:py-8">
        <h1>Пошук</h1>
        <SearchInput />
      </div>
    )
  }
  const chapters = await payload.find({
    collection: 'bookChapters',
    where: {
      'book.slug': {
        equals: slug,
      },
    },
    limit: 0,
  })
  const allChaptersTexts = chapters.docs.map((chapter) => {
    const { title, content, id } = chapter
    const plainText = extractPlainText(content)
    return {
      id,
      title,
      content: plainText,
    }
  })
  const filteredChapters = allChaptersTexts.filter((chapter) => {
    const { content } = chapter
    return content.toLowerCase().includes(search.toLowerCase())
  })
  //crop around 250 characters from the content , around the search query
  const croppedChapters = filteredChapters.map((chapter) => {
    const { title, content, id } = chapter
    const searchLower = search.toLowerCase()
    const contentLower = content.toLowerCase()

    const matches: { start: number; end: number }[] = []

    let index = 0
    while ((index = contentLower.indexOf(searchLower, index)) !== -1) {
      matches.push({ start: index, end: index + search.length })
      index += search.length
    }

    const snippets = matches.map(({ start, end }) => {
      const contextStart = Math.max(0, start - 125)
      const contextEnd = Math.min(content.length, end + 125)
      return content.substring(contextStart, contextEnd)
    })

    return {
      id,
      title,
      snippets,
    }
  })

  return (
    <div className="container mx-auto py-4 md:py-8">
      <p>Цей пошук дуже неефективний і повільний, але поки що єдиний варіант шукати по тексту...</p>
      <h1 className="font-bold text-xl">Пошук</h1>
      <SearchInput />
      {filteredChapters.length > 0 ? (
        <div className="flex flex-col gap-4 mt-2">
          {croppedChapters.map((chapter, index) => {
            const { title, snippets, id } = chapter
            return (
              <div key={index} className="flex flex-col gap-2 border rounded-lg px-2 py-3">
                <h2>{title}</h2>
                {snippets.map((snippet, i) => (
                  <p key={i}>
                    {'...'}
                    {snippet
                      .split(new RegExp(`(${search})`, 'gi'))
                      .map((part, index) =>
                        part.toLowerCase() === search.toLowerCase() ? (
                          <mark key={index}>{part}</mark>
                        ) : (
                          part
                        ),
                      )}
                    {'...'}
                  </p>
                ))}
                <Button asChild>
                  <Link href={`/admin/collections/bookChapters/${id}`} target="_blank">
                    Редагувати
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <p>Нічого не знайдено</p>
      )}
    </div>
  )
}

export default EditorPage
