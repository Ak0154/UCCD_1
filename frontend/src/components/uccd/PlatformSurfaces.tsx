import { useState } from 'react'
import { Container, PrimaryButton, GhostButton } from './ui'

const plans = [
  {
    name: 'Agent Workspace',
    price: '360',
    description: 'One screen for case history, AI guidance, response drafting, and audit trail',
    features: ['Unified timeline', 'AI draft response', 'Next-best action'],
    cta: 'Open view',
    popular: false,
  },
  {
    name: 'Supervisor HQ',
    price: 'SLA',
    description: 'Queue health, escalation risk, workload balance, and intervention controls',
    features: [
      'Breach prediction',
      'Team heatmap',
      'Priority routing',
      'Load signals',
    ],
    cta: 'Monitor queue',
    popular: true,
  },
  {
    name: 'Regulatory View',
    price: 'RBI',
    description: 'Formal complaint tracking, filing deadlines, evidence, and report generation',
    features: [
      'Deadline tracker',
      'Compliance flags',
      'Evidence links',
      'Exportable reports',
    ],
    cta: 'Review cases',
    popular: false,
  },
]

export function PlatformSurfaces() {
  const [live, setLive] = useState(true)

  return (
    <section id="platform" className="border-t border-border py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <h2 className="font-display text-[2.35rem] leading-tight tracking-[-0.02em] text-text">
            Four operational surfaces.
            <br />
            One complaint truth.
          </h2>
          <p className="text-base leading-relaxed text-muted lg:text-right">
            Agents, supervisors, compliance officers, and analysts see the same
            case record through role-specific controls.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 border border-border py-4">
          <span className={live ? 'text-text' : 'text-muted'}>Live mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={live}
            onClick={() => setLive((y) => !y)}
            className={`relative h-6 w-10 cursor-pointer rounded-full transition ${live ? 'bg-accent' : 'bg-border'}`}
          >
            <span
              className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition ${live ? 'translate-x-4' : ''}`}
            />
          </button>
          <span className={!live ? 'text-text' : 'text-muted'}>Simulation</span>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-accent">
            What-if ready
          </span>
        </div>

        <div className="mt-px grid border border-border md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col p-6 ${plan.popular ? 'bg-surface/80 ring-1 ring-accent/30' : 'bg-bg'} border-border md:border-l first:md:border-l-0`}
            >
              {plan.popular && (
                <span className="mb-4 w-fit rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                  Priority surface
                </span>
              )}
              <h3 className="text-lg font-medium text-text">{plan.name}</h3>
              <p className="mt-4 font-display text-4xl text-text">
                {plan.price}
                <span className="text-base font-normal text-muted"> view</span>
              </p>
              <p className="mt-2 text-sm text-muted">{plan.description}</p>
              <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-muted">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-accent" aria-hidden>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.popular ? (
                  <PrimaryButton className="w-full">{plan.cta}</PrimaryButton>
                ) : (
                  <GhostButton className="w-full">{plan.cta}</GhostButton>
                )}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
