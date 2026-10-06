'use client'
import React, { useState } from 'react'

import {
  EmailShareButton,
  FacebookShareButton,
  TelegramShareButton,
  TwitterShareButton,
} from 'react-share'
import { Button } from './ui/button'
import { Check, Facebook, Link2, Mail, Send, Twitter } from 'lucide-react'
import { getClientSideURL } from '@/lib/getURL'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const SharePost = ({ className }: { className?: string }) => {
  const base = getClientSideURL()
  const path = usePathname()
  const url = `${base}${path}`
  const [copied, setCopied] = useState(false)
  const buttonClass = 'size-11 rounded-xl'

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // буфер обміну недоступний — нічого не робимо
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button asChild variant="secondary" size="icon" className={buttonClass}>
        <TelegramShareButton url={url} resetButtonStyle={false} aria-label="Поширити в Telegram">
          <Send />
        </TelegramShareButton>
      </Button>
      <Button asChild variant="secondary" size="icon" className={buttonClass}>
        <TwitterShareButton url={url} resetButtonStyle={false} aria-label="Поширити в X">
          <Twitter />
        </TwitterShareButton>
      </Button>
      <Button asChild variant="secondary" size="icon" className={buttonClass}>
        <FacebookShareButton url={url} resetButtonStyle={false} aria-label="Поширити у Facebook">
          <Facebook />
        </FacebookShareButton>
      </Button>
      <Button asChild variant="secondary" size="icon" className={buttonClass}>
        <EmailShareButton url={url} resetButtonStyle={false} aria-label="Поширити email">
          <Mail />
        </EmailShareButton>
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className={buttonClass}
        onClick={copyLink}
        aria-label={copied ? 'Посилання скопійовано' : 'Скопіювати посилання'}
      >
        {copied ? <Check className="text-primary" /> : <Link2 />}
      </Button>
    </div>
  )
}

export default SharePost
