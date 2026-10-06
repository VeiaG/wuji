import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <Skeleton className="h-11 w-64 rounded-xl md:h-14" />
      <Skeleton className="mt-1 h-[52px] w-80 max-w-full rounded-2xl" />
      <div className="h-[560px] max-w-[880px] animate-pulse rounded-tile bg-tile" />
    </div>
  )
}
