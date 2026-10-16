import { LivePreviewListener } from './LivePreviewListener'

/** Слухач live preview + плашка режиму чернетки з виходом із draft mode. */
export const DraftPreview = ({ path }: { path: string }) => (
  <>
    <LivePreviewListener />
    <div className="fixed right-4 bottom-24 z-50 flex items-center gap-3 rounded-[14px] bg-chip py-2 pr-2 pl-4 text-sm shadow-float md:bottom-4">
      <span className="text-muted-foreground">Перегляд чернетки</span>
      <a
        href={`/next/exit-preview?path=${encodeURIComponent(path)}`}
        className="rounded-xl bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:opacity-90"
      >
        Вийти
      </a>
    </div>
  </>
)
