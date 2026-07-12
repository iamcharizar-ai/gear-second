import { useCallback, useEffect, useMemo, useState } from 'react'
import { SPLIT_MAP } from './config/exercises'
import {
  loadActiveSession,
  saveActiveSession,
  sessionExerciseFor,
  type ActiveSession as Session,
  type WorkoutSummary,
} from './lib/workout'
import { appendHistory, bestsByExercise, loadHistory } from './lib/history'
import type { ExerciseBest } from './lib/prs'
import { pushWorkout, bootSync } from './lib/cloudSync'
import { ensureNotifyPermission } from './lib/useRestTimer'
import { Home } from './screens/Home'
import { ActiveSession } from './screens/ActiveSession'
import { Summary } from './screens/Summary'

type View = 'home' | 'active' | 'summary'

export default function App() {
  const [history, setHistory] = useState<WorkoutSummary[]>(() => loadHistory())
  const [session, setSessionState] = useState<Session | null>(() => loadActiveSession())
  const [view, setView] = useState<View>(() => (loadActiveSession() ? 'active' : 'home'))
  const [summary, setSummary] = useState<{ w: WorkoutSummary; before: Map<string, ExerciseBest> } | null>(null)

  const bests = useMemo(() => bestsByExercise(history), [history])

  useEffect(() => {
    ensureNotifyPermission()
    void bootSync().then(() => setHistory(loadHistory()))
  }, [])

  // persist + mirror active session on every change (functional to dodge stale closures)
  const setSession = useCallback((fn: (prev: Session) => Session) => {
    setSessionState((prev) => {
      if (!prev) return prev
      const next = fn(prev)
      saveActiveSession(next)
      return next
    })
  }, [])

  function startSplit(splitId: string) {
    const split = SPLIT_MAP.get(splitId)
    if (!split) return
    const s: Session = {
      id: 'w-' + Date.now().toString(36),
      name: split.name,
      splitId: split.id,
      startedAt: new Date().toISOString(),
      entries: split.plan.map((p) => sessionExerciseFor(p.exerciseId, p.sets)),
    }
    saveActiveSession(s)
    setSessionState(s)
    setView('active')
  }

  function finish(w: WorkoutSummary) {
    const before = bestsByExercise(history) // bests EXCLUDING this session → drives Summary PR list
    const next = appendHistory(w)
    setHistory(next)
    void pushWorkout(w) // fire-and-forget to the LifeOS ledger (XP + vault write-back)
    saveActiveSession(null)
    setSessionState(null)
    setSummary({ w, before })
    setView('summary')
  }

  function abort() {
    saveActiveSession(null)
    setSessionState(null)
    setView('home')
  }

  if (view === 'active' && session)
    return (
      <ActiveSession
        session={session}
        setSession={setSession}
        history={history}
        bests={bests}
        onFinish={finish}
        onAbort={abort}
      />
    )

  if (view === 'summary' && summary)
    return (
      <Summary
        workout={summary.w}
        bestsBefore={summary.before}
        onDone={() => {
          setSummary(null)
          setView('home')
        }}
      />
    )

  return <Home history={history} onStart={startSplit} />
}
