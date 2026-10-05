import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore } from './lib/store'
import { ConfirmHost } from './components/Confirm'
import { History as HistoryIcon, House, Play } from 'lucide-react'
import { Home } from './screens/Home'
import { History } from './screens/History'
import { WorkoutScreen } from './screens/Workout'
import { Session } from './screens/Session'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { RoutineEditor } from './screens/RoutineEditor'

type View =
  | { name: 'home' }
  | { name: 'history' }
  | { name: 'workout' }
  | { name: 'session'; id: string; celebrate?: boolean }
  | { name: 'exercise'; id: string }
  | { name: 'routine'; id: string | null }

const keyOf = (v: View) => JSON.stringify(v)

/**
 * Screens are entries in the browser history, so the phone's back gesture and
 * the in-app back arrows behave the same. Scroll position is remembered per
 * screen (coming back from an exercise's history drops you where you were in
 * the workout).
 */
export default function App() {
  const s = useStore()
  const [view, setView] = useState<View>(() => {
    // A reload keeps history.state; the "workout complete" moment should only show once.
    const v = (history.state?.view as View) ?? { name: 'home' }
    // the Stats screen moved to Vitals: an old history entry for it lands on Home
    if ((v.name as string) === 'stats') return { name: 'home' }
    return v.name === 'session' && v.celebrate ? { name: 'home' } : v
  })
  const scrolls = useRef(new Map<string, number>())
  const restore = useRef<number | null>(0)
  const viewRef = useRef(view)
  viewRef.current = view

  useEffect(() => {
    history.replaceState({ view: viewRef.current }, '')
  }, [])

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      scrolls.current.set(keyOf(view), window.scrollY)
      let next = (e.state?.view as View) ?? { name: 'home' }
      if ((next.name as string) === 'stats') next = { name: 'home' }
      restore.current = scrolls.current.get(keyOf(next)) ?? 0
      setView(next)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [view])

  useLayoutEffect(() => {
    if (restore.current != null) {
      window.scrollTo(0, restore.current)
      restore.current = null
    }
  }, [view])

  const go = useCallback((next: View, replace = false) => {
    scrolls.current.set(keyOf(view), window.scrollY)
    restore.current = 0
    if (replace) history.replaceState({ view: next }, '')
    else history.pushState({ view: next }, '')
    setView(next)
  }, [view])
  const back = useCallback(() => {
    if (history.state?.view && history.length > 1 && view.name !== 'home') history.back()
    else go({ name: 'home' }, true)
  }, [go, view.name])

  // A workout screen with no workout (finished in another tab) falls back home.
  const shown: View = view.name === 'workout' && !s.active ? { name: 'home' } : view

  const openExercise = (id: string) => go({ name: 'exercise', id })
  const openSession = (id: string) => go({ name: 'session', id })
  const editRoutine = (id: string | null) => go({ name: 'routine', id })

  const tabs = shown.name === 'home' || shown.name === 'history'

  return (
    <div className={`app ${tabs ? 'has-tabs' : ''}`}>
      {shown.name === 'home' && <Home onOpenWorkout={() => go({ name: 'workout' })} onEditRoutine={editRoutine} onOpenSession={openSession} />}
      {shown.name === 'history' && <History onOpenSession={openSession} />}
      {shown.name === 'workout' && (
        <WorkoutScreen
          onMinimize={back}
          onFinished={(id) => go({ name: 'session', id, celebrate: true }, true)}
          onOpenExercise={openExercise}
        />
      )}
      {shown.name === 'session' && (
        <Session
          key={shown.id}
          id={shown.id}
          celebrate={Boolean(shown.celebrate)}
          onBack={shown.celebrate ? () => go({ name: 'home' }, true) : back}
          onOpenExercise={openExercise}
          onEditRoutine={(id) => go({ name: 'routine', id })}
        />
      )}
      {shown.name === 'exercise' && <ExerciseDetail key={shown.id} id={shown.id} onBack={back} onOpenSession={openSession} />}
      {shown.name === 'routine' && <RoutineEditor key={shown.id ?? 'new'} id={shown.id} onDone={back} />}

      {tabs && (
        <nav className="tabbar" aria-label="Main">
          {s.active && (
            <button type="button" className="tab live" onClick={() => go({ name: 'workout' })}>
              <Play size={18} strokeWidth={2.5} aria-hidden="true" /><span>Workout</span>
            </button>
          )}
          <button type="button" className={`tab ${shown.name === 'home' ? 'on' : ''}`} onClick={() => shown.name !== 'home' && go({ name: 'home' }, true)} aria-current={shown.name === 'home' ? 'page' : undefined}>
            <House size={18} strokeWidth={2.5} aria-hidden="true" /><span>Home</span>
          </button>
          <button type="button" className={`tab ${shown.name === 'history' ? 'on' : ''}`} onClick={() => shown.name !== 'history' && go({ name: 'history' }, true)} aria-current={shown.name === 'history' ? 'page' : undefined}>
            <HistoryIcon size={18} strokeWidth={2.5} aria-hidden="true" /><span>History</span>
          </button>
        </nav>
      )}
      <ConfirmHost />
    </div>
  )
}
