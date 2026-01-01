'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Banner as BannerType } from '@/payload-types'
import Link from 'next/link'
import { parseSimpleMarkdown } from '@/lib/parseSimpleMarkdown'

interface BannerProps {
  banner: BannerType
}

const STORAGE_KEY = 'dismissed-banner'

/**
 * Client компонент для відображення банера
 * Зберігає тільки останній закритий банер (один uniqueID) в localStorage
 * При закритті нового банера старий автоматично видаляється
 */
export function Banner({ banner }: BannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const settings = banner.settings
    if (!settings?.uniqueID) {
      return
    }

    // Перевіряємо localStorage
    try {
      const dismissedBannerId = localStorage.getItem(STORAGE_KEY)

      // Якщо збережений ID співпадає з поточним, банер вже закритий
      if (dismissedBannerId !== settings.uniqueID) {
        setIsVisible(true)
      }
    } catch (error) {
      console.error('Error reading dismissed banner from localStorage:', error)
      // Якщо помилка з localStorage, показуємо банер
      setIsVisible(true)
    }
  }, [banner.settings])

  const handleDismiss = () => {
    const settings = banner.settings
    if (!settings?.uniqueID) {
      return
    }

    try {
      // Просто зберігаємо поточний uniqueID (старий автоматично перезаписується)
      localStorage.setItem(STORAGE_KEY, settings.uniqueID)
      setIsVisible(false)
    } catch (error) {
      console.error('Error saving dismissed banner to localStorage:', error)
      // Все одно закриваємо банер навіть якщо не вдалося зберегти
      setIsVisible(false)
    }
  }

  if (!isVisible || !banner.settings) {
    return null
  }

  const { text, isDismissible, isLink, linkSettings } = banner.settings

  return (
    <div className="w-full bg-secondary text-secondary-foreground">
      <div className="container mx-auto flex items-center justify-between gap-4 py-2 px-4">
        <div className="flex-1 flex items-center justify-center gap-4">
          <p className="text-sm text-center">{parseSimpleMarkdown(text)}</p>
          {isLink && linkSettings?.url && linkSettings?.buttonText && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="shrink-0"
            >
              <Link
                href={linkSettings.url}
                target={linkSettings.openInNewTab ? '_blank' : undefined}
                rel={linkSettings.openInNewTab ? 'noopener noreferrer' : undefined}
              >
                {linkSettings.buttonText}
              </Link>
            </Button>
          )}
        </div>
        {isDismissible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label="Закрити банер"
            className="shrink-0 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
