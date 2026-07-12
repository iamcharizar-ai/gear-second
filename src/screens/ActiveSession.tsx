import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DEFAULT_REST_SEC,
  sessionExerciseFor,
  summarize,
  newSetEntry,
  type ActiveSession as Session,
  type SetEntry,
} from '../lib/workout'
import type { WorkoutSummary } from '../lib/workout'
import { EXERCISE_MAP } from '../config/exercises'
import { detectSetPRs, EMPTY_BEST, PR_LABEL, type ExerciseBest, type PRKind } from '../lib/prs'
import { lastSetsFor } from '../lib/history'
import { useRestTimer } from '../lib/useRestTimer'
import { ExercisePicker } from '../components/ExercisePicker'

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ActiveSession({
  session,
  setSession,
  history,
  bests,
  onFinish,
  onAbort,
}: {
  session: Session
  setSession: (fn: (prev: Session) => Session) => void
  history: WorkoutSummary[]
  bests: Map<string, ExerciseBest>
  onFinish: (w: WorkoutSummary) => void
  onAbort: () => void
}) {
  const rest = useRestTimer()
  const [picking, setPicking] = useState(false)
  const [abortArm, setAbortArm] = useState(false)
  const [flash, setFlash] = useState<{ kinds: PRKind[]; name: string } | null>(null)
  const [elapsed, setElapsed] = useState('')

  // wake-lock so the screen-off rest alert still fires on device
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinel> } }
    nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {})
    return () => {
      void lock?.release().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      const min = Math.max(0, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000))
      setElapsed(`${min} min`)
    }, 1000)
    return () => clearInterval(t)
  }, [session.startedAt])

  function updateSet(exIdx: number, setIdx: number, patch: Partial<SetEntry>) {
    // functional update — two ✓ taps in one frame must not clobber via a stale closure
    setSession((prev) => {
      const entries = prev.entries.map((e, i) => {
        if (i !== exIdx) return e
        return { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) }
      })
      return { ...prev, entries }
    })
  }

  function toggleDone(exIdx: number, setIdx: number) {
    const ex = session.entries[exIdx]
    const set = ex.sets[setIdx]
    const nowDone = !set.done
    updateSet(exIdx, setIdx, { done: nowDone })
    if (nowDone) {
      rest.start(DEFAULT_REST_SEC)
      const best = bests.get(ex.name) ?? EMPTY_BEST
      const val = { weight: parseFloat(set.weight) || 0, reps: parseFloat(set.reps) || 0 }
      const pr = detectSetPRs(ex.kind, val, best)
      if (pr.kinds.length) {
        setFlash({ kinds: pr.kinds, name: ex.name })
        if ('vibrate' in navigator) navigator.vibrate(40)
        setTimeout(() => setFlash(null), 1800)
      }
    }
  }

  function addSet(exIdx: number) {
    setSession((prev) => ({
      ...prev,
      entries: prev.entries.map((e, i) => (i === exIdx ? { ...e, sets: [...e.sets, newSetEntry()] } : e)),
    }))
  }

  function addExercise(exerciseId: string) {
    setSession((prev) => ({ ...prev, entries: [...prev.entries, sessionExerciseFor(exerciseId, 3)] }))
    setPicking(false)
  }

  function finish() {
    onFinish(summarize(session))
  }

  const doneSets = session.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)

  return (
    <div className="mx-auto max-w-md px-4 pb-40 pt-3">
      <header className="mb-4 flex items-center justify-between px-1">
        <div>
          <div className="text-lg font-bold">{session.name}</div>
          <div className="text-xs text-faint">
            {elapsed} · {doneSets} sets done
          </div>
        </div>
        <button
          onClick={() => {
            if (abortArm) onAbort()
            else {
              setAbortArm(true)
              setTimeout(() => setAbortArm(false), 2500)
            }
          }}
          className={`pill text-xs ${abortArm ? 'bg-accent text-ink' : 'bg-card-2 text-dim'}`}
        >
          {abortArm ? 'Tap to discard' : 'Abort'}
        </button>
      </header>

      <div className="flex flex-col gap-4">
        {session.entries.map((ex, exIdx) => {
          const cat = EXERCISE_MAP.get(ex.exerciseId)
          const ghost = lastSetsFor(history, ex.name)
          const isWeight = ex.kind === 'weight'
          const repLabel = ex.kind === 'time' ? 'sec' : 'reps'
          return (
            <section key={`${ex.exerciseId}-${exIdx}`} className="card !p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="font-semibold">{ex.name}</span>
                <span className="text-[11px] uppercase tracking-wider text-faint">
                  {cat?.primary.join(' · ') ?? 'custom'}
                </span>
              </div>

              <div className="mb-1 grid grid-cols-[28px_1fr_1fr_44px] items-center gap-2 px-1 text-[11px] text-faint">
                <span>#</span>
                <span>{isWeight ? 'kg' : ''}</span>
                <span>{repLabel}</span>
                <span />
              </div>

              {ex.sets.map((s, setIdx) => {
                const g = ghost[setIdx]
                return (
                  <div
                    key={setIdx}
                    className={`grid grid-cols-[28px_1fr_1fr_44px] items-center gap-2 py-1.5 ${
                      s.done ? 'opacity-95' : ''
                    }`}
                  >
                    <span className="num text-sm text-faint">{setIdx + 1}</span>
                    {isWeight ? (
                      <input
                        inputMode="decimal"
                        type="number"
                        value={s.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, { weight: e.target.value })}
                        placeholder={g ? String(g.weight) : '—'}
                        className="num rounded-xl bg-card-2 px-3 py-2.5 text-center text-base outline-none placeholder:text-faint/60 focus:ring-1 focus:ring-accent"
                      />
                    ) : (
                      <span className="text-center text-xs text-faint">—</span>
                    )}
                    <input
                      inputMode="numeric"
                      type="number"
                      value={s.reps}
                      onChange={(e) => updateSet(exIdx, setIdx, { reps: e.target.value })}
                      placeholder={g ? String(g.reps) : '—'}
                      className="num rounded-xl bg-card-2 px-3 py-2.5 text-center text-base outline-none placeholder:text-faint/60 focus:ring-1 focus:ring-accent"
                    />
                    <button
                      onClick={() => toggleDone(exIdx, setIdx)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-base transition ${
                        s.done ? 'bg-good text-ink' : 'bg-card-2 text-faint active:bg-line'
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                )
              })}

              <button
                onClick={() => addSet(exIdx)}
                className="mt-2 w-full rounded-xl bg-card-2 py-2 text-xs font-medium text-dim active:bg-line"
              >
                + Add set
              </button>
            </section>
          )
        })}
      </div>

      <button
        onClick={() => setPicking(true)}
        className="mt-4 w-full rounded-card border border-dashed border-line py-3 text-sm font-medium text-dim active:bg-card"
      >
        + Add exercise
      </button>

      {/* rest timer bar */}
      <AnimatePresence>
        {rest.active && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="safe-bottom fixed inset-x-0 bottom-[76px] z-20 mx-auto max-w-md px-4"
          >
            <div className="flex items-center gap-3 rounded-card bg-card-2 px-4 py-3 shadow-lg">
              <span className="num text-xl font-bold text-accent">{fmt(rest.remaining)}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-300"
                  style={{ width: `${rest.total ? (rest.remaining / rest.total) * 100 : 0}%` }}
                />
              </div>
              <button onClick={() => rest.bump(15)} className="text-xs font-semibold text-dim">
                +15
              </button>
              <button onClick={rest.stop} className="text-xs font-semibold text-accent-soft">
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PR flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center"
          >
            <div className="rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-ink shadow-xl">
              ⭑ {flash.kinds.map((k) => PR_LABEL[k]).join(' · ')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* finish */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <button
          onClick={finish}
          disabled={doneSets === 0}
          className="pill w-full bg-accent py-3.5 text-base text-ink disabled:opacity-40"
        >
          Finish workout
        </button>
      </div>

      <AnimatePresence>{picking && <ExercisePicker onPick={addExercise} onClose={() => setPicking(false)} />}</AnimatePresence>
    </div>
  )
}
