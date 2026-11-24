import React from 'react'
import { BrandMark } from './BrandMark'
import './branding.css'

/** Логотип на сторінці входу (`admin.components.graphics.Logo`): марка + «вучи», як у хедері сайту */
export default function Logo() {
  return (
    <div className="admin-logo">
      <BrandMark className="admin-logo__mark" />
      <span className="admin-logo__word">
        ву<span className="admin-logo__accent">чи</span>
      </span>
    </div>
  )
}
