import { motion } from 'framer-motion'
import { SPLITS } from '../config/exercises'
import type { WorkoutSummary } from '../lib/workout'
import { cloudOn } from '../lib/supabase'

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 86_400_000
  if (d < 1) return 'today'
  if (d < 2) return 'yesterday'
  return `${Math.floor(d)}d ago`
}

export function Home({
  history,
  onStart,
}: {
  history: WorkoutSummary[]
  onStart: (splitId: string) => void
}) {
  const last = history[0]
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-28 pt-3">
      <header className="flex items-baseline justify-between px-1 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">
          STRONG<span className="text-accent">//</span>
        </h1>
        <span className="text-xs text-faint">{cloudOn ? 'synced' : 'local'}</span>
      </header>

      {last && (
        <section className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-dim">Last session</span>
            <span className="text-xs text-faint">{timeAgo(last.finishedAt)}</span>
          </div>
          <div className="mt-2 text-lg font-semibold">{last.name}</div>
          <div className="mt-3 flex gap-6">
            <Stat n={last.totalSets} unit="sets" />
            <Stat n={last.volumeKg} unit="kg vol" />
            <Stat n={last.durationMin} unit="min" />
          </div>
        </section>
      )}

      <div className="px-1 pt-1 text-sm font-semibold text-dim">Start a workout</div>
      <div className="grid grid-cols-2 gap-3">
        {SPLITS.map((s) => (
          <motion.button
            key={s.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart(s.id)}
            className="card flex flex-col items-start gap-2 !p-4 text-left active:bg-card-2"
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="font-semibold leading-tight">{s.name}</span>
            <span className="text-xs text-faint">{s.plan.length} exercises</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function Stat({ n, unit }: { n: number; unit: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="num text-2xl font-bold">{n}</span>
      <span className="text-xs text-faint">{unit}</span>
    </div>
  )
}
