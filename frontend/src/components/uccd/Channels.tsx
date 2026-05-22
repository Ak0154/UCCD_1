import { Container, ChevronRight } from './ui'

const channels = [
  { symbol: 'EML', name: 'Email', price: 'Thread-aware', change: '+IMAP' },
  { symbol: 'SOC', name: 'Social', price: 'Public risk', change: '+Meta/X' },
  { symbol: 'VOC', name: 'Voice', price: 'Transcript', change: '+STT' },
  { symbol: 'BOT', name: 'Chat/Bot', price: 'Handoff', change: '+Webhook' },
  { symbol: 'APP', name: 'Portal/App', price: 'Structured', change: '+REST' },
  { symbol: 'REG', name: 'Regulator', price: 'Formal case', change: '+Priority' },
]

function ChannelPill({
  symbol,
  name,
  price,
  change,
}: {
  symbol: string
  name: string
  price: string
  change: string
}) {
  return (
    <div className="channel-cylinder flex shrink-0 items-center gap-3 rounded-full border border-border bg-surface px-4 py-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-border/60 text-xs font-semibold text-text">
        {symbol.slice(0, 3)}
      </div>
      <div>
        <p className="text-sm font-medium text-text">{name}</p>
        <div className="flex gap-2 text-xs">
          <span className="text-muted">{price}</span>
          <span className="text-accent">{change}</span>
        </div>
      </div>
    </div>
  )
}

export function Channels() {
  const movingChannels = [...channels, ...channels]

  return (
    <section id="channels" className="overflow-hidden py-20">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <h2 className="font-display text-[2.35rem] leading-tight tracking-[-0.02em] text-text">
            Complaints from every channel. One pipeline.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Email, social, voice, chat, portal, app, and regulator cases are
            normalized into a single complaint envelope for consistent action.
          </p>
          <a
            href="#workflow"
            className="mt-8 inline-flex items-center gap-2 text-base font-medium text-accent transition hover:gap-3"
          >
            Follow a case
            <ChevronRight />
          </a>
        </div>
        <div className="relative min-h-[250px] overflow-hidden border-y border-border py-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent" />
          <div className="channel-track flex w-max gap-4">
            {movingChannels.map((c, index) => (
              <ChannelPill key={`${c.symbol}-${index}`} {...c} />
            ))}
          </div>
          <div className="channel-track-slow mt-5 flex w-max gap-4">
            {movingChannels.slice().reverse().map((c, index) => (
              <ChannelPill key={`${c.symbol}-slow-${index}`} {...c} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
