import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Container, ChevronRight } from './ui'

const faqs = [
  'What is UCCD?',
  'Which channels are supported?',
  'What do the AI agents produce?',
  'How does SLA prediction work?',
  'Can compliance teams use it?',
  'Does it replace human agents?',
  'What powers the AI stack?',
  'Can it run a demo flow?',
]

const answers: Record<string, string> = {
  'What is UCCD?':
    'UCCD is a Unified Customer Complaint Communication Dashboard for intake, AI triage, SLA tracking, routing, and resolution.',
  'Which channels are supported?':
    'The architecture covers email, social, voice, chat or bot, portal or app, and regulator-origin complaints.',
  'What do the AI agents produce?':
    'They generate classification labels, emotion signals, severity, escalation risk, complaint DNA, root cause hints, and next-best actions.',
  'How does SLA prediction work?':
    'The dashboard presents breach risk and countdowns so supervisors can intervene before a deadline is missed.',
  'Can compliance teams use it?':
    'Yes. Regulatory View tracks formal cases, evidence, required actions, deadlines, and report exports.',
  'Does it replace human agents?':
    'No. It assists agents with context and drafts while keeping review, approval, and customer response under human control.',
  'What powers the AI stack?':
    'The project references Groq, Sarvam, Redis, FastAPI, React, and supporting data stores for the demo architecture.',
  'Can it run a demo flow?':
    'Yes. The repo includes API routes for complaints, agents, analytics, history, simulation, dashboard, and WebSocket updates.',
}

export function Questions() {
  const [open, setOpen] = useState<string | null>(null)
  const half = Math.ceil(faqs.length / 2)
  const cols = [faqs.slice(0, half), faqs.slice(half)]

  return (
    <section id="faq" className="relative overflow-hidden border-t border-border py-20">
      <div className="pointer-events-none absolute left-1/2 top-10 h-48 w-[70%] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <h2 className="font-display text-[2.35rem] leading-tight tracking-[-0.02em] text-text">
            UCCD Questions, Answered
          </h2>
          <a
            href="#platform"
            className="inline-flex items-center gap-2 text-base font-medium text-accent"
          >
            Explore platform
            <ChevronRight />
          </a>
        </div>

        <div className="relative mt-12 grid border border-border bg-bg md:grid-cols-2">
          {cols.map((column, colIdx) => (
            <div
              key={colIdx}
              className={colIdx === 1 ? 'border-t border-border md:border-t-0 md:border-l' : ''}
            >
              {column.map((q) => (
                <div key={q} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    className="group flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-base text-text transition hover:bg-surface/40"
                    onClick={() => setOpen(open === q ? null : q)}
                    aria-expanded={open === q}
                  >
                    {q}
                    <span className="text-muted transition group-hover:rotate-90 group-hover:text-accent">
                      {open === q ? '-' : '+'}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open === q && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 text-sm leading-relaxed text-muted">
                          {answers[q]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
