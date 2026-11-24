'use client'

import React from 'react'
import { Button } from '@payloadcms/ui'
import { ArrowLeft } from 'lucide-react'
import './BackToSite.css'

/**
 * Кнопка «На сайт» у шапці адмінки (`admin.components.actions`, поруч із breadcrumbs).
 * Зручно в PWA на телефоні, де немає адресного рядка. Звичайне посилання, а не роутер
 * адмінки: сайт — окремий layout.
 */
export function BackToSite() {
  return (
    <Button
      aria-label="Повернутися на сайт"
      buttonStyle="ghost"
      className="back-to-site"
      el="anchor"
      icon={<ArrowLeft aria-hidden size={16} />}
      iconPosition="left"
      margin={false}
      url="/"
    >
      <span className="back-to-site__label">На сайт</span>
    </Button>
  )
}
