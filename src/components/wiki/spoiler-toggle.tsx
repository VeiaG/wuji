import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  // path of the current page, without query params
  basePath: string
  spoilersShown: boolean
  readerProgress: number
  hiddenCount?: number
}

/**
 * Server-safe spoiler gate banner: shows what the gate is based on and a
 * link that toggles the ?spoilers=1 query param on the current page.
 */
const SpoilerToggle = ({ basePath, spoilersShown, readerProgress, hiddenCount }: Props) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-3">
      <div className="text-sm text-muted-foreground">
        {spoilersShown ? (
          <span>Показано все, включно зі спойлерами.</span>
        ) : readerProgress > 0 ? (
          <span>
            Приховано спойлери після розділу <b className="text-foreground">{readerProgress}</b>{' '}
            (ваш прогрес читання).
            {hiddenCount ? <> Приховано записів: {hiddenCount}.</> : null}
          </span>
        ) : (
          <span>
            У вас немає збереженого прогресу читання, тому все, що прив’язане до розділів,
            приховано як спойлери.
            {hiddenCount ? <> Приховано записів: {hiddenCount}.</> : null}
          </span>
        )}
      </div>
      <Button asChild variant={spoilersShown ? 'secondary' : 'outline'} size="sm">
        {spoilersShown ? (
          <Link href={basePath}>
            <EyeOff />
            Сховати спойлери
          </Link>
        ) : (
          <Link href={`${basePath}?spoilers=1`}>
            <Eye />
            Показати спойлери
          </Link>
        )}
      </Button>
    </div>
  )
}

export default SpoilerToggle
