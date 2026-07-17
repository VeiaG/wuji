import Link from 'next/link'
import { getFooter } from '@/lib/footer'
import { blockIcons } from '@/components/blocks/icons'

export default async function Footer() {
  const currentYear = new Date().getFullYear()
  const footer = await getFooter()

  return (
    <footer className="bg-muted py-12 ">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">ВуЧи</h3>
            {footer?.description && (
              <p className="text-sm text-muted-foreground">{footer.description}</p>
            )}
            {footer?.socialLinks && footer.socialLinks.length > 0 && (
              <div className="flex gap-4">
                {footer.socialLinks.map((social) => {
                  const Icon = blockIcons[social.icon]
                  return (
                    <a
                      key={social.id || social.url}
                      href={social.url}
                      className="text-muted-foreground hover:text-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      <span className="sr-only">{social.label}</span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {footer?.columns?.map((column) => (
            <div key={column.id || column.title} className="space-y-4">
              <h3 className="text-lg font-bold">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => {
                  const isExternal = /^https?:\/\//.test(link.url)
                  const className = 'text-sm text-muted-foreground hover:text-primary'

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

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} {footer?.copyright || 'ВуЧи. Всі права захищені.'}
          </p>
        </div>
      </div>
    </footer>
  )
}
