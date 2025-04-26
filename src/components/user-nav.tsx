'use client'

import { useAuth } from '@/providers/auth'
import { Fragment } from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { ShieldUser } from 'lucide-react'

const UserNav = () => {
  const { user } = useAuth()
  const isHideClassNames = user === undefined ? 'hidden' : 'flex'
  if (user) {
    return (
      <Fragment>
        <Button variant="outline" asChild className={isHideClassNames}>
          <Link href="/profile">Профіль</Link>
        </Button>
        {user.roles.includes('admin') && (
          <Button variant="outline" asChild size="icon" className={isHideClassNames}>
            <Link href="/admin">
              <ShieldUser />
            </Link>
          </Button>
        )}
      </Fragment>
    )
  }
  return (
    <Fragment>
      <Button variant="outline" asChild className={isHideClassNames}>
        <Link href="/login">Увійти</Link>
      </Button>
      <Button asChild className={isHideClassNames}>
        <Link href="/register">Реєстрація</Link>
      </Button>
    </Fragment>
  )
}

export default UserNav
