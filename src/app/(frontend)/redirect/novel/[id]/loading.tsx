// app/(frontend)/redirect/novel/[id]/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-muted mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Перехід до розділу...</p>
      </div>
    </div>
  )
}
