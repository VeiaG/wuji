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
  return (
    <div className="mt-8 py-4 border-t flex gap-2 justify-between items-center">
      <span>Поширити</span>
      <div className="flex gap-2 items-center">
        <Button asChild variant="outline" size="icon" className="rounded-full">
          <TwitterShareButton url={url} resetButtonStyle={false}>
            <Twitter />
          </TwitterShareButton>
        </Button>
        <Button asChild variant="outline" size="icon" className="rounded-full">
          <FacebookShareButton url={url} resetButtonStyle={false}>
            <Facebook />
          </FacebookShareButton>
        </Button>
        <Button asChild variant="outline" size="icon" className="rounded-full">
          <LinkedinShareButton url={url} resetButtonStyle={false}>
            <Linkedin />
          </LinkedinShareButton>
        </Button>
        <Button asChild variant="outline" size="icon" className="rounded-full">
          <EmailShareButton url={url} resetButtonStyle={false}>
            <Share2 />
          </EmailShareButton>
        </Button>
      </div>
    </div>
  )
}

export default SharePost
