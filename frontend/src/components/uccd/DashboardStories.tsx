import { motion } from 'framer-motion'
import { useState } from 'react'
import { Container } from './ui'

const quotes = [
  {
    text: 'The agent screen keeps SLA, complaint history, draft response, and similar cases in one place, so handoffs are much cleaner.',
    name: 'Agent Workspace',
    role: 'Daily complaint handling',
  },
  {
    text: 'Supervisor HQ surfaces breach trajectory and workload pressure before the queue turns into an escalation pile.',
    name: 'Supervisor HQ',
    role: 'Queue and team control',
  },
]

export function DashboardStories() {
  const [index, setIndex] = useState(0)
  const q = quotes[index]

  return (
    <section className="border-t border-border py-20">
      <Container>
        <h2 className="max-w-lg font-display text-[2.35rem] leading-tight tracking-[-0.02em] text-text">
          Role-specific dashboards, built around complaint operations
        </h2>
        <div className="mt-12 rounded-2xl border border-border bg-surface/50 p-8 md:p-12">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <blockquote className="text-xl leading-relaxed text-text md:text-2xl">
              &ldquo;{q.text}&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-text">{q.name}</p>
                <p className="text-sm text-muted">{q.role}</p>
              </div>
              <div className="flex gap-4 text-sm text-muted">
                <button
                  type="button"
                  className="cursor-pointer transition hover:text-text"
                  onClick={() =>
                    setIndex((i) => (i === 0 ? quotes.length - 1 : i - 1))
                  }
                >
                  &lt; Previous
                </button>
                <button
                  type="button"
                  className="cursor-pointer transition hover:text-text"
                  onClick={() =>
                    setIndex((i) => (i === quotes.length - 1 ? 0 : i + 1))
                  }
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
