'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Bell, Info, AlertTriangle, AlertCircle, CheckCheck, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Toggle } from '@/components/ui/toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useNotificationsContext } from '@/components/NotificationsProvider'
import { useAuth } from '@/providers/auth'
import { stringify } from 'qs-esm'
import { SanitizedMarkdown } from '@/components/SanitizedMarkdown'
import type { Notification } from '@/payload-types'

const PAGE_SIZE = 30

const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: 'text-blue-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
  error: { icon: AlertCircle, color: 'text-destructive' },
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
  const { icon: Icon, color } = typeConfig[notification.type] ?? typeConfig.info

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5 flex-shrink-0', color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-left leading-snug">{notification.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {notification.message && (
          <>
            <Separator />
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <SanitizedMarkdown content={notification.message} />
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
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
                  <ExternalLink className="h-4 w-4 mr-2" />
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
  const { icon: Icon, color } = typeConfig[notification.type] ?? typeConfig.info

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
        'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !notification.read && 'bg-muted/20',
      )}
      onClick={() => onOpenDialog(notification)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenDialog(notification)}
    >
      <div className={cn('mt-0.5 flex-shrink-0', color)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className={cn('text-sm truncate', !notification.read && 'font-medium')}>
            {notification.title}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {relativeTime(notification.createdAt)}
          </span>
        </div>
        {notification.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {notification.message.replace(/[#*`_~]/g, '')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
        {notification.link && (
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {!notification.read && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </div>
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
  const [dialogNotification, setDialogNotification] = useState<Notification | null>(null)

  const fetchPage = useCallback(
    async (pageNum: number, unreadOnly: boolean, append = false) => {
      if (!user) return
      try {
        const where: Record<string, unknown> = { user: { equals: user.id } }
        if (unreadOnly) where.read = { equals: false }
        const qs = stringify({ where, sort: '-createdAt', limit: PAGE_SIZE, page: pageNum })
        const res = await fetch(`/api/notifications?${qs}`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        setNotifications((prev) => (append ? [...prev, ...(data.docs ?? [])] : (data.docs ?? [])))
        setHasMore(data.hasNextPage ?? false)
      } catch (error) {
        console.error('[NotificationsPage] fetch failed:', error)
      }
    },
    [user],
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Bell className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Увійдіть щоб бачити сповіщення</p>
        <Button asChild><Link href="/login">Увійти</Link></Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Сповіщення</h1>
          {unreadCount > 0 && (
            <span className="text-sm text-muted-foreground">{unreadCount} непрочитаних</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Toggle
            pressed={onlyUnread}
            onPressedChange={setOnlyUnread}
            size="sm"
            className="gap-2"
          >
            {onlyUnread ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline text-xs">{onlyUnread ? 'Непрочитані' : 'Всі'}</span>
          </Toggle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Позначити всі</span>
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden divide-y">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-3">
              <Skeleton className="h-4 w-4 rounded-full mt-0.5 flex-shrink-0" />
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
              <div className="px-4 py-2">
                <Button variant="ghost" className="w-full text-sm" onClick={loadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? 'Завантаження...' : 'Завантажити ще'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {onlyUnread ? 'Немає непрочитаних' : 'Немає сповіщень'}
            </p>
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
