import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tile } from '@/components/bento'
import Link from 'next/link'

export default function Component() {
  return (
    <div className="container-page pb-10 pt-6 md:pt-14">
      <Tile className="mx-auto flex w-full max-w-[440px] flex-col gap-6 p-7 text-center md:p-9">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-2 grid size-14 place-items-center rounded-2xl bg-primary/15">
            <CheckCircle className="size-7 text-primary" />
          </div>
          <h1 className="heading-display text-[clamp(22px,6.4vw,28px)]">Реєстрація успішна!</h1>
          <p className="text-[15px] text-muted-foreground text-balance">
            Ваш обліковий запис було створено. Тепер ви можете одразу увійти в систему.
          </p>
        </div>

        <Button asChild className="h-12 w-full rounded-2xl text-[15px]">
          <Link href="/login">Перейти до входу</Link>
        </Button>

        <p className="text-sm text-muted-foreground">
          Виникли питання?{' '}
          <Link href="https://veiag.dev/" className="font-semibold text-primary hover:opacity-90">
            Зв&apos;яжіться з підтримкою
          </Link>
        </p>
      </Tile>
    </div>
  )
}
