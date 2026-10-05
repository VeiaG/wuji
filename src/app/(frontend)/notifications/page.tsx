'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Bell, Info, AlertTriangle, AlertCircle, CheckCheck, ExternalLink, MessageCircle, Reply } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Chip } from '@/components/bento'
import { useNotificationsContext } from '@/components/NotificationsProvider'
import { useAuth } from '@/providers/auth'
import { stringify } from 'qs-esm'
import { SanitizedMarkdown } from '@/components/SanitizedMarkdown'
import type { Notification } from '@/payload-types'

const PAGE_SIZE = 30

const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: 'text-soft' },
  warning: { icon: AlertTriangle, color: 'text-primary' },
  error: { icon: AlertCircle, color: 'text-destructive' },
}

// Category drives the icon (topic); type still drives the color (severity).
const categoryIcon: Partial<Record<Notification['category'], React.ElementType>> = {
  comment: MessageCircle,
  reply: Reply,
}

function getVisual(notification: Notification): { icon: React.ElementType; color: string } {
  const { icon: typeIcon, color } = typeConfig[notification.type] ?? typeConfig.info
  const icon = categoryIcon[notification.category] ?? typeIcon
  return { icon, color }
}

// Filter tabs → the categories each tab includes ('all' means no filter).
type CategoryFilter = 'all' | 'comments' | 'system'
const categoryFilterMap: Record<Exclude<CategoryFilter, 'all'>, Notification['category'][]> = {
  comments: ['comment', 'reply'],
  system: ['system'],
}

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'щойно'
  if (minutes < 60) return `${minutes} хв тому`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} год тому`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} д тому`
  return new Date(dateString).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

// --- Dialog ---

function NotificationDialog({
  notification,
  open,
  onOpenChange,
  onMarkAsRead,
}: {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMarkAsRead: (id: string) => void
}) {
  if (!notification) return null
  const { icon: Icon, color } = getVisual(notification)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-6">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl bg-chip',
                color,
              )}
            >
              <Icon className="size-5" />
            </span>
            <DialogTitle className="min-w-0 flex-1 text-left text-lg font-bold leading-snug">
              {notification.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        {notification.message && (
          <div className="prose prose-sm prose-invert max-w-none text-soft prose-p:text-soft">
            <SanitizedMarkdown content={notification.message} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[13px] text-muted-foreground">
            {new Date(notification.createdAt).toLocaleDateString('uk-UA', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
          <div className="flex items-center gap-2">
            {!notification.read && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onMarkAsRead(notification.id)
                  onOpenChange(false)
                }}
              >
                Позначити прочитаним
              </Button>
            )}
            {notification.link && (
              <Button size="sm" asChild>
                <Link href={notification.link} onClick={() => onOpenChange(false)}>
                  <ExternalLink className="size-4" />
                  Перейти
                </Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// --- Row ---

function NotificationRow({
  notification,
  onOpenDialog,
}: {
  notification: Notification
  onOpenDialog: (n: Notification) => void
}) {
  const { icon: Icon, color } = getVisual(notification)

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-tile-sm bg-tile p-3.5 transition-colors md:gap-4 md:p-4',
        'hover:bg-[color-mix(in_srgb,var(--tile)_92%,white)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        !notification.read && 'ring-1 ring-primary/40',
      )}
      onClick={() => onOpenDialog(notification)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenDialog(notification)}
    >
      <span
        className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl bg-chip', color)}
      >
        <Icon className="size-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              'truncate text-[15px]',
              notification.read ? 'font-medium text-soft' : 'font-bold',
            )}
          >
            {notification.title}
          </span>
          <span className="shrink-0 text-[13px] whitespace-nowrap text-muted-foreground">
            {relativeTime(notification.createdAt)}
          </span>
        </div>
        {notification.message && (
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">
            {notification.message.replace(/[#*`_~]/g, '')}
          </p>
        )}
      </div>

      {(notification.link || !notification.read) && (
        <div className="flex shrink-0 items-center gap-2">
          {notification.link && <ExternalLink className="size-4 text-muted-foreground" />}
          {!notification.read && (
            <span className="size-2 rounded-full bg-primary" aria-label="Непрочитане" />
          )}
        </div>
      )}
    </div>
  )
}

// --- Page ---

export default function NotificationsPage() {
  const { user } = useAuth()
  const { unreadCount, refresh: refreshCount } = useNotificationsContext()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [onlyUnread, setOnlyUnread] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [dialogNotification, setDialogNotification] = useState<Notification | null>(null)
  // Monotonic request id — only the latest in-flight fetch may update state, so a slow
  // response for a previous filter/tab can't overwrite a newer one (race guard).
  const requestIdRef = useRef(0)

  const fetchPage = useCallback(
    async (pageNum: number, unreadOnly: boolean, append = false) => {
      if (!user) return
      const requestId = ++requestIdRef.current
      try {
        const where: Record<string, unknown> = { user: { equals: user.id } }
        if (unreadOnly) where.read = { equals: false }
        if (categoryFilter !== 'all') {
          where.category = { in: categoryFilterMap[categoryFilter] }
        }
        const qs = stringify({ where, sort: '-createdAt', limit: PAGE_SIZE, page: pageNum })
        const res = await fetch(`/api/notifications?${qs}`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        // A newer request superseded this one — discard the stale result.
        if (requestId !== requestIdRef.current) return
        setNotifications((prev) => (append ? [...prev, ...(data.docs ?? [])] : (data.docs ?? [])))
        setHasMore(data.hasNextPage ?? false)
      } catch (error) {
        console.error('[NotificationsPage] fetch failed:', error)
      }
    },
    [user, categoryFilter],
  )

  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    setPage(1)
    fetchPage(1, onlyUnread).finally(() => setIsLoading(false))
  }, [user, onlyUnread, fetchPage])

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ read: true }),
        })
        if (!res.ok) return
        setNotifications((prev) =>
          onlyUnread
            ? prev.filter((n) => n.id !== id)
            : prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        )
        setDialogNotification((prev) => (prev?.id === id ? { ...prev, read: true } : prev))
        refreshCount()
      } catch (error) {
        console.error('[NotificationsPage] markAsRead failed:', error)
      }
    },
    [onlyUnread, refreshCount],
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    const qs = stringify({
      where: { user: { equals: user.id }, read: { equals: false } },
    })
    await fetch(`/api/notifications?${qs}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ read: true }),
    })
    setPage(1)
    fetchPage(1, onlyUnread)
    refreshCount()
  }, [user, fetchPage, onlyUnread, refreshCount])

  const handleOpenDialog = (n: Notification) => {
    setDialogNotification(n)
    if (!n.read) markAsRead(n.id)
  }

  const loadMore = async () => {
    const next = page + 1
    setIsLoadingMore(true)
    await fetchPage(next, onlyUnread, true)
    setPage(next)
    setIsLoadingMore(false)
  }

  if (!user) {
    return (
      <div className="container-page pt-2">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-tile bg-tile p-8 text-center">
          <h1 className="heading-display text-xl">Сповіщення</h1>
          <p className="text-muted-foreground">Увійдіть, щоб бачити сповіщення</p>
          <Button asChild className="mt-2">
            <Link href="/login">Увійти</Link>
          </Button>
        </div>
      </div>
    )
  }

  const segmentButton = (active: boolean) =>
    cn(
      'inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 text-[15px] font-bold transition-colors md:px-5',
      active ? 'bg-primary text-primary-foreground' : 'text-soft hover:text-foreground',
    )

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-2">
        <div className="flex flex-col gap-1">
          <h1 className="heading-display text-[32px] md:text-[44px]">Сповіщення</h1>
          <span className="text-[15px] text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} непрочитаних` : 'Усе прочитано'}
          </span>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllAsRead}>
            <CheckCheck className="size-4" />
            Позначити всі прочитаними
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Категорії */}
        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-tile p-[5px] [scrollbar-width:none]">
          {(
            [
              ['all', 'Всі'],
              ['comments', 'Коментарі'],
              ['system', 'Система'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategoryFilter(value)}
              className={segmentButton(categoryFilter === value)}
              aria-pressed={categoryFilter === value}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Непрочитані / всі */}
        <div className="flex gap-2">
          <button type="button" onClick={() => setOnlyUnread(true)} aria-pressed={onlyUnread}>
            <Chip active={onlyUnread}>Непрочитані</Chip>
          </button>
          <button type="button" onClick={() => setOnlyUnread(false)} aria-pressed={!onlyUnread}>
            <Chip active={!onlyUnread}>Усі</Chip>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-tile-sm bg-tile p-4">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))
        ) : notifications.length > 0 ? (
          <>
            {notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} onOpenDialog={handleOpenDialog} />
            ))}
            {hasMore && (
              <Button
                variant="secondary"
                className="mt-2 self-center"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Завантаження...' : 'Завантажити ще'}
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-tile bg-tile px-6 py-14 text-center">
            <Bell className="mb-1 size-8 text-muted-foreground" />
            <p className="heading-display text-xl">
              {onlyUnread ? 'Немає непрочитаних' : 'Немає сповіщень'}
            </p>
            <p className="text-sm text-muted-foreground">Тут з’являться відповіді та новини сайту</p>
          </div>
        )}
      </div>

      <NotificationDialog
        notification={dialogNotification}
        open={!!dialogNotification}
        onOpenChange={(open) => !open && setDialogNotification(null)}
        onMarkAsRead={markAsRead}
      />
    </div>
  )
}
