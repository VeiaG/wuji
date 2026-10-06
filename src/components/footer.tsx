import Link from 'next/link'
import { getFooter } from '@/lib/footer'
import { blockIcons } from '@/components/blocks/icons'
import { Logo } from '@/components/logo'

export default async function Footer() {
  const currentYear = new Date().getFullYear()
  const footer = await getFooter()

  return (
    <footer className="container-page pt-16 pb-6">
      <div className="rounded-tile bg-tile p-7 md:p-9">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            {footer?.description && (
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {footer.description}
              </p>
            )}
            {footer?.socialLinks && footer.socialLinks.length > 0 && (
              <div className="flex gap-2">
                {footer.socialLinks.map((social) => {
                  const Icon = blockIcons[social.icon]
                  return (
                    <a
                      key={social.id || social.url}
                      href={social.url}
                      className="grid size-11 place-items-center rounded-[14px] bg-chip text-soft transition-colors hover:text-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {Icon && <Icon className="size-[18px]" />}
                      <span className="sr-only">{social.label}</span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {footer?.columns?.map((column) => (
            <div key={column.id || column.title} className="space-y-4">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => {
                  const isExternal = /^https?:\/\//.test(link.url)
                  const className = 'text-[15px] text-soft transition-colors hover:text-primary'

                  return (
                    <li key={link.id || link.url}>
                      {isExternal || link.newTab ? (
                        <a
                          href={link.url}
                          className={className}
                          target={link.newTab ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.url} className={className}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t pt-6 text-sm text-muted-foreground">
          © {currentYear} {footer?.copyright || 'ВуЧи. Всі права захищені.'}
        </div>
      </div>
    </footer>
  )
}
