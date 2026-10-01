import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { MUSCLE_LABEL } from '../data/exercises'
import { blankExercise, discardWorkout, exerciseById, finishWorkout, getState, updateActive, useStore } from '../lib/store'
import { fmtSetShort, planFor, previousSets, type Plan } from '../lib/stats'
import { linkNext, move, normalize, remove, supersetLabels, unlink } from '../lib/supersets'
import type { DoneSet, Exercise, LiveExercise, LiveSet } from '../lib/types'
import { confirmDialog } from '../lib/confirm'
import { ExercisePicker } from '../components/ExercisePicker'
import { SkillWork } from '../components/SkillWork'
import { ArrowDown, ArrowLeftRight, ArrowUp, Check, ChevronLeft, Ellipsis, Link2, Minus, Plus, StickyNote, Trash2 } from 'lucide-react'

// ── mutations on the live workout ───────────────────────────────────────────
const patchEx = (u: string, fn: (e: LiveExercise) => LiveExercise) =>
  updateActive((w) => ({ ...w, exercises: w.exercises.map((e) => (e.uid === u ? fn(e) : e)) }))
const listOp = (fn: (l: LiveExercise[]) => LiveExercise[]) => updateActive((w) => ({ ...w, exercises: fn(w.exercises) }))
const setSet = (u: string, i: number, patch: Partial<LiveSet>) =>
  patchEx(u, (e) => ({ ...e, sets: e.sets.map((s, k) => (k === i ? { ...s, ...patch } : s)) }))

const cleanKg = (v: string) => v.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 6)
const cleanReps = (v: string) => v.replace(/\D/g, '').slice(0, 4)
const isNum = (v: string) => /^\d+(\.\d+)?$/.test(v)

function useWakeLock() {
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> }
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock
    if (!wl) return
    let lock: Sentinel | null = null
    const get = () => { if (document.visibilityState === 'visible') wl.request('screen').then((l) => { lock = l }, () => {}) }
    get()
    document.addEventListener('visibilitychange', get)
    return () => { document.removeEventListener('visibilitychange', get); void lock?.release() }
  }, [])
}

function Clock({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return <span className="clock">{h ? `${h}:${p(m)}` : m}:{p(sec)}</span>
}

export function WorkoutScreen({
  onMinimize,
  onFinished,
  onOpenExercise,
}: {
  onMinimize: () => void
  onFinished: (id: string) => void
  onOpenExercise: (id: string) => void
}) {
  const s = useStore()
  const w = s.active
  const [picker, setPicker] = useState<null | { replace: string | null }>(null)
  useWakeLock()

  const labels = useMemo(() => supersetLabels(w?.exercises ?? []), [w?.exercises])

  // After ticking a set in a superset, jump to the partner exercise's same set.
  const onTicked = useCallback((u: string, i: number) => {
    const list = getState().active?.exercises ?? []
    const me = list.find((e) => e.uid === u)
    if (!me?.superset) return
    const group = list.filter((e) => e.superset === me.superset)
    const next = group[(group.indexOf(me) + 1) % group.length]
    if (!next || next.uid === u) return
    const row = document.getElementById(`set-${next.uid}-${Math.min(i, next.sets.length - 1)}`) ?? document.getElementById(`ex-${next.uid}`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const onReplace = useCallback((u: string) => setPicker({ replace: u }), [])

  if (!w) return null

  const done = w.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0)

  const finish = async () => {
    const loose = w.exercises.reduce((n, e) => n + e.sets.filter((x) => !x.done && (x.kg || x.reps)).length, 0)
    if (!done) {
      if (await confirmDialog('No sets are ticked, so there is nothing to save. Discard this workout?', 'Discard', true)) {
        discardWorkout()
        onMinimize()
      }
      return
    }
    if (loose && !(await confirmDialog(`${loose} set${loose > 1 ? 's have' : ' has'} numbers but ${loose > 1 ? 'aren\'t' : 'isn\'t'} ticked. Those will be dropped. Finish anyway?`, 'Finish'))) return
    const saved = finishWorkout()
    if (saved) onFinished(saved.id)
  }

  const discard = async () => {
    if (await confirmDialog('Discard this workout? Nothing from it will be saved.', 'Discard', true)) {
      discardWorkout()
      onMinimize()
    }
  }

  return (
    <div className="screen workout">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onMinimize} aria-label="Back to home (workout keeps running)"><ChevronLeft size={18} strokeWidth={2.5} aria-hidden="true" /></button>
        <input
          className="title-input"
          value={w.name}
          onChange={(e) => updateActive((x) => ({ ...x, name: e.target.value }))}
          aria-label="Workout name"
        />
        <Clock since={w.startedAt} />
        <button type="button" className="btn primary sm" onClick={finish}>Finish</button>
      </header>

      <div className="workout-meta">
        <span><b>{done}</b> sets done</span>
        <span>{w.exercises.length} exercises</span>
      </div>

      <textarea
        className="note"
        rows={1}
        placeholder="Workout note"
        value={w.note}
        onChange={(e) => updateActive((x) => ({ ...x, note: e.target.value }))}
      />

      <SkillWork />

      {w.exercises.map((e, idx) => (
        <ExerciseCard
          key={e.uid}
          ex={e}
          def={exerciseById(e.exerciseId, s)}
          prev={previousSets(e.exerciseId, s.workouts)}
          ssLetter={e.superset ? labels.get(e.superset)?.letter ?? null : null}
          ssColor={e.superset ? labels.get(e.superset)?.color ?? null : null}
          first={idx === 0}
          last={idx === w.exercises.length - 1}
          nextInGroup={Boolean(e.superset) && w.exercises[idx + 1]?.superset === e.superset}
          onTicked={onTicked}
          onInfo={onOpenExercise}
          onReplace={onReplace}
        />
      ))}

      {!w.exercises.length && <p className="empty">Add your first exercise to get going.</p>}

      <button type="button" className="btn primary wide" onClick={() => setPicker({ replace: null })}>
        <Plus size={18} strokeWidth={2.5} aria-hidden="true" /> Add exercise
      </button>
      <button type="button" className="btn danger-ghost wide" onClick={discard}>Discard workout</button>

      {picker && (
        <ExercisePicker
          multi={!picker.replace}
          onClose={() => setPicker(null)}
          onPick={(ids) => {
            if (picker.replace) {
              const u = picker.replace
              patchEx(u, (e) => ({ ...e, exerciseId: ids[0], sets: e.sets.map(() => ({ kg: '', reps: '', done: false })) }))
            } else {
              listOp((l) => [...l, ...ids.map((id) => blankExercise(id))])
            }
            setPicker(null)
          }}
        />
      )}
    </div>
  )
}

const ExerciseCard = memo(function ExerciseCard({
  ex, def, prev, ssLetter, ssColor, first, last, nextInGroup, onTicked, onInfo, onReplace,
}: {
  ex: LiveExercise
  def: Exercise
  prev: DoneSet[] | null
  ssLetter: string | null
  ssColor: string | null
  first: boolean
  last: boolean
  nextInGroup: boolean
  onTicked: (uid: string, i: number) => void
  onInfo: (id: string) => void
  onReplace: (uid: string) => void
}) {
  const [menu, setMenu] = useState(false)
  const [noteOpen, setNoteOpen] = useState(Boolean(ex.note))
  const plan: Plan = useMemo(() => planFor(def.type, ex.sets.length, ex.repMin, ex.repMax, prev), [def.type, ex.sets.length, ex.repMin, ex.repMax, prev])
  const hasKg = def.type !== 'bodyweight' && def.type !== 'duration'
  const kgHead = def.type === 'weighted' ? '+KG' : def.type === 'assisted' ? '-KG' : 'KG'
  const repHead = def.type === 'duration' ? 'SEC' : 'REPS'

  const focus = (i: number, field: 'kg' | 'reps') => document.getElementById(`in-${ex.uid}-${i}-${field}`)?.focus()

  const tick = (i: number) => {
    const set = ex.sets[i]
    if (set.done) return setSet(ex.uid, i, { done: false })
    const t = plan.targets[Math.min(i, plan.targets.length - 1)]
    let kg = set.kg
    if (hasKg && kg === '') kg = isNum(t.kg) ? t.kg : def.type === 'weight' ? '' : '0'
    const reps = set.reps !== '' ? set.reps : isNum(t.reps) ? t.reps : ''
    if (hasKg && kg === '') return focus(i, 'kg')
    if (reps === '' || reps === '0') return focus(i, 'reps')
    setSet(ex.uid, i, { kg, reps, done: true })
    onTicked(ex.uid, i)
  }

  const act = (fn: () => void) => { fn(); setMenu(false) }

  return (
    <section
      id={`ex-${ex.uid}`}
      className={`card ex-card ${ssLetter ? 'in-ss' : ''} ${nextInGroup ? 'ss-joined' : ''}`}
      style={ssColor ? ({ '--ss': ssColor } as React.CSSProperties) : undefined}
    >
      <div className="ex-head">
        {ssLetter && <span className="ss-tag" title="Superset">{ssLetter}</span>}
        <button type="button" className="ex-name" onClick={() => onInfo(def.id)}>
          {def.name}
          <small>
            {ex.repMin != null && ex.repMax != null && <em>{ex.repMin}-{ex.repMax} reps · </em>}
            {def.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}
          </small>
        </button>
        <button type="button" className={`icon-btn ${menu ? 'on' : ''}`} onClick={() => setMenu((m) => !m)} aria-label="Exercise options" aria-expanded={menu}>
          <Ellipsis size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      {menu && (
        <div className="menu-row">
          {!last && !nextInGroup && <button type="button" onClick={() => act(() => listOp((l) => linkNext(l, ex.uid)))}><Link2 size={18} strokeWidth={2.5} aria-hidden="true" /> Superset with next</button>}
          {ex.superset && <button type="button" onClick={() => act(() => listOp((l) => unlink(l, ex.uid)))}><Link2 size={18} strokeWidth={2.5} aria-hidden="true" /> Remove from superset</button>}
          {!first && <button type="button" onClick={() => act(() => listOp((l) => move(l, ex.uid, -1)))}><ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" /> Up</button>}
          {!last && <button type="button" onClick={() => act(() => listOp((l) => move(l, ex.uid, 1)))}><ArrowDown size={18} strokeWidth={2.5} aria-hidden="true" /> Down</button>}
          <button type="button" onClick={() => act(() => setNoteOpen(true))}><StickyNote size={18} strokeWidth={2.5} aria-hidden="true" /> Note</button>
          <button type="button" onClick={() => act(() => onReplace(ex.uid))}><ArrowLeftRight size={18} strokeWidth={2.5} aria-hidden="true" /> Replace</button>
          <button
            type="button"
            className="danger"
            onClick={async () => {
              setMenu(false)
              if (!ex.sets.some((x) => x.done) || (await confirmDialog(`Remove ${def.name} and its ticked sets?`, 'Remove', true)))
                listOp((l) => normalize(remove(l, ex.uid)))
            }}
          >
            <Trash2 size={18} strokeWidth={2.5} aria-hidden="true" /> Remove
          </button>
        </div>
      )}

      {noteOpen && (
        <textarea
          className="note"
          rows={Math.min(5, Math.max(1, Math.ceil(ex.note.length / 34)))}
          placeholder="Note for this exercise"
          value={ex.note}
          onChange={(e) => patchEx(ex.uid, (x) => ({ ...x, note: e.target.value }))}
          onBlur={() => { if (!ex.note.trim()) setNoteOpen(false) }}
        />
      )}

      {plan.hint && <p className={`hint ${plan.up ? 'up' : ''}`}>{plan.up && <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />} {plan.hint}</p>}

      <div className={`sets ${hasKg ? '' : 'no-kg'}`} role="table" aria-label={`${def.name} sets`}>
        <div className="set-row head" role="row">
          <span>SET</span><span>PREVIOUS</span>{hasKg && <span>{kgHead}</span>}<span>{repHead}</span><span aria-label="Done"><Check size={15} strokeWidth={2.5} aria-hidden="true" /></span>
        </div>
        {ex.sets.map((set, i) => {
          const t = plan.targets[Math.min(i, plan.targets.length - 1)]
          const p = prev?.[i]
          return (
            <div key={i} id={`set-${ex.uid}-${i}`} className={`set-row ${set.done ? 'done' : ''}`} role="row">
              <span className="set-n">{i + 1}</span>
              <span className="prev">{p ? fmtSetShort(def.type, p) : '-'}</span>
              {hasKg && (
                <input
                  id={`in-${ex.uid}-${i}-kg`}
                  inputMode="decimal"
                  value={set.kg}
                  placeholder={t.kg}
                  aria-label={`Set ${i + 1} ${kgHead}`}
                  onChange={(e) => setSet(ex.uid, i, { kg: cleanKg(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                />
              )}
              <input
                id={`in-${ex.uid}-${i}-reps`}
                inputMode="numeric"
                value={set.reps}
                placeholder={t.reps}
                aria-label={`Set ${i + 1} ${repHead}`}
                onChange={(e) => setSet(ex.uid, i, { reps: cleanReps(e.target.value) })}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') tick(i) }}
              />
              <button type="button" className="tick" onClick={() => tick(i)} aria-pressed={set.done} aria-label={`Set ${i + 1} done`}>
                <Check size={18} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

      <div className="set-actions">
        <button type="button" className="btn sm" onClick={() => patchEx(ex.uid, (e) => ({ ...e, sets: [...e.sets, { kg: '', reps: '', done: false }] }))}>
          <Plus size={18} strokeWidth={2.5} aria-hidden="true" /> Set
        </button>
        {ex.sets.length > 1 && (
          <button type="button" className="btn sm" onClick={() => patchEx(ex.uid, (e) => ({ ...e, sets: e.sets.slice(0, -1) }))}>
            <Minus size={18} strokeWidth={2.5} aria-hidden="true" /> Set
          </button>
        )}
      </div>
    </section>
  )
})
