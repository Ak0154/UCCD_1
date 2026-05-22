import { Container } from './ui'

const steps = [
  {
    n: 1,
    title: 'Ingest and normalize',
    description: 'Channel data becomes one complaint record with source context and evidence.',
    visual: ['Email', 'Social', 'Voice', 'Regulator'],
  },
  {
    n: 2,
    title: 'Analyze in parallel',
    description:
      'AI agents classify, score, deduplicate, predict breach risk, and suggest next action.',
    visual: ['NLP', 'DNA', 'SLA', 'RCA'],
  },
  {
    n: 3,
    title: 'Route and resolve',
    description:
      'The right team gets the case, drafts a compliant response, and feeds learning back.',
    visual: ['Fraud Ops', 'Draft', 'Audit', 'Closed'],
  },
]

function StepVisual({
  step,
  items,
}: {
  step: number
  items: string[]
}) {
  if (step === 1) {
    return (
      <div className="relative h-full w-full p-4">
        <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-accent/20" />
        <div className="grid h-full grid-cols-2 gap-3">
          {items.map((item, index) => (
            <div key={item} className="relative rounded-lg border border-border bg-bg/80 p-3">
              <span className="text-xs text-text">{item}</span>
              <span
                className={`absolute top-1/2 h-0.5 w-[6px] -translate-y-1/2 bg-accent/40 ${
                  index % 2 === 0 ? '-right-[6px]' : '-left-[6px]'
                }`}
              />
              <span className={`absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent ${
                index % 2 === 0 ? '-right-[3px]' : '-left-[3px]'
              }`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="grid h-full grid-cols-2 gap-3 p-4">
        {items.map((item, index) => (
          <div key={item} className="rounded-lg border border-accent/20 bg-accent/10 p-3">
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${62 + index * 9}%` }}
              />
            </div>
            <p className="text-xs font-medium text-text">{item}</p>
            <p className="mt-1 text-[10px] text-accent">output ready</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full rounded-xl border border-border bg-bg/80 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-accent">Route</span>
          <span className="rounded-full border border-accent/30 px-2 py-1 text-[10px] text-accent">
            SLA safe
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-xs text-text">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Steps() {
  return (
    <section className="pb-20">
      <Container>
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {steps.map((s) => (
            <article
              key={s.n}
              className="flex flex-col bg-bg p-6 md:min-h-[400px]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface font-medium text-text">
                {s.n}
              </div>
              <div className="mt-auto flex flex-1 flex-col justify-end border-t border-border/50 pt-6">
                <h3 className="text-lg font-medium text-text">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.description}
                </p>
              </div>
              <div className="mt-6 h-44 rounded-lg border border-border/50 bg-gradient-to-b from-surface to-bg">
                <StepVisual step={s.n} items={s.visual} />
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
