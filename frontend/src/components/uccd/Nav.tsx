import { Container, PrimaryButton } from './ui'

const links = [
  { href: '#features', label: 'Agents' },
  { href: '#channels', label: 'Channels' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#platform', label: 'Platform' },
  { href: '#api-docs', label: 'API Docs' },
  { href: '#faq', label: 'FAQ' },
]

export function Nav() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/80 bg-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-display text-lg font-medium text-text">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Zm0 2.3L5.5 8.2v7.6l6.5 3.4 6.5-3.4V8.2L12 4.8Zm0 3.2 3.2 1.7v3.8L12 15.2l-3.2-1.7V9.7L12 8Z" />
            </svg>
          </span>
          OmniResol
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted transition-colors hover:text-text"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <PrimaryButton className="hidden sm:inline-flex">Request demo</PrimaryButton>
      </Container>
    </header>
  )
}
