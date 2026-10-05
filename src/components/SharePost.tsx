'use client'
import React from 'react'

import {
  EmailShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
} from 'react-share'
import { Button } from './ui/button'
import { Facebook, Linkedin, Share2, Twitter } from 'lucide-react'
import { getClientSideURL } from '@/lib/getURL'
import { usePathname } from 'next/navigation'

const SharePost = () => {
  const base = getClientSideURL()
  const path = usePathname()
  const url = `${base}${path}`
  const buttonClass = 'size-11 rounded-xl'
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border pt-6">
      <span className="text-[15px] font-semibold text-soft">Поширити</span>
      <div className="flex items-center gap-2">
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
          <LinkedinShareButton url={url} resetButtonStyle={false} aria-label="Поширити у LinkedIn">
            <Linkedin />
          </LinkedinShareButton>
        </Button>
        <Button asChild variant="secondary" size="icon" className={buttonClass}>
          <EmailShareButton url={url} resetButtonStyle={false} aria-label="Поширити email">
            <Share2 />
          </EmailShareButton>
        </Button>
      </div>
    </div>
  )
}

export default SharePost
