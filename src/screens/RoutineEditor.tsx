import { useMemo, useState } from 'react'
import { MUSCLE_LABEL } from '../data/exercises'
import { deleteRoutine, exerciseById, saveRoutine, uid, useStore } from '../lib/store'
import { linkNext, move, remove, supersetLabels, unlink } from '../lib/supersets'
import type { Routine, RoutineItem } from '../lib/types'
import { confirmDialog } from '../lib/confirm'
import { ExercisePicker } from '../components/ExercisePicker'
import { Px } from '../components/Pixel'

const DEFAULT = { sets: 3, repMin: 8, repMax: 12 }
const clampInt = (v: string, lo: number, hi: number) => Math.max(lo, Math.min(hi, parseInt(v, 10) || lo))

export function RoutineEditor({ id, onDone }: { id: string | null; onDone: () => void }) {
  const s = useStore()
  const original = id ? s.routines.find((r) => r.id === id) ?? null : null
  const [draft, setDraft] = useState<Routine>(() => original ?? { id: uid(), name: '', items: [], updatedAt: '' })
  const [picker, setPicker] = useState(false)
  const [openNotes, setOpenNotes] = useState<string[]>([])
  const labels = useMemo(() => supersetLabels(draft.items), [draft.items])
  const dirty = JSON.stringify(draft) !== JSON.stringify(original ?? { ...draft, name: '', items: [] })

  const setItems = (fn: (l: RoutineItem[]) => RoutineItem[]) => setDraft((d) => ({ ...d, items: fn(d.items) }))
  const patch = (u: string, p: Partial<RoutineItem>) => setItems((l) => l.map((it) => (it.uid === u ? { ...it, ...p } : it)))

  const back = async () => {
    if (dirty && !(await confirmDialog('Discard your changes to this routine?', 'Discard', true))) return
    onDone()
  }
  const save = () => {
    const name = draft.name.trim() || 'Untitled routine'
    saveRoutine({ ...draft, name })
    onDone()
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={back} aria-label="Back"><Px name="back" /></button>
        <input
          className="title-input"
          value={draft.name}
          placeholder="Routine name"
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          aria-label="Routine name"
          autoFocus={!original}
        />
        <button type="button" className="btn primary sm" onClick={save} disabled={!draft.items.length}>Save</button>
      </header>

      {draft.items.length === 0 && <p className="empty">Add exercises, then set sets and a rep range for each.</p>}

      {draft.items.map((it, i) => {
        const def = exerciseById(it.exerciseId, s)
        const l = it.superset ? labels.get(it.superset) : null
        const joined = Boolean(it.superset) && draft.items[i + 1]?.superset === it.superset
        const timed = def.type === 'duration'
        return (
          <section
            key={it.uid}
            className={`card ex-card ${l ? 'in-ss' : ''} ${joined ? 'ss-joined' : ''}`}
            style={l ? ({ '--ss': l.color } as React.CSSProperties) : undefined}
          >
            <div className="ex-head">
              {l && <span className="ss-tag">{l.letter}</span>}
              <span className="ex-name">
                {def.name}
                <small>{def.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}</small>
              </span>
            </div>
            <div className="plan-row">
              <label>Sets
                <span className="stepper">
                  <button type="button" onClick={() => patch(it.uid, { sets: Math.max(1, it.sets - 1) })} aria-label="Fewer sets"><Px name="minus" u={1.5} /></button>
                  <b>{it.sets}</b>
                  <button type="button" onClick={() => patch(it.uid, { sets: Math.min(12, it.sets + 1) })} aria-label="More sets"><Px name="plus" u={1.5} /></button>
                </span>
              </label>
              <label>{timed ? 'Seconds' : 'Reps'}
                <span className="range">
                  <input inputMode="numeric" value={it.repMin} onChange={(e) => patch(it.uid, { repMin: clampInt(e.target.value, 1, 999) })} aria-label="Minimum" />
                  <i>-</i>
                  <input inputMode="numeric" value={it.repMax} onChange={(e) => patch(it.uid, { repMax: clampInt(e.target.value, 1, 999) })} onBlur={() => { if (it.repMax < it.repMin) patch(it.uid, { repMax: it.repMin }) }} aria-label="Maximum" />
                </span>
              </label>
            </div>
            {(it.note || openNotes.includes(it.uid)) && (
              <textarea className="note" rows={1} placeholder="Note (setup, cues)" value={it.note} autoFocus={!it.note} onChange={(e) => patch(it.uid, { note: e.target.value })} />
            )}
            <div className="menu-row">
              {i < draft.items.length - 1 && !joined && <button type="button" onClick={() => setItems((l) => linkNext(l, it.uid))}><Px name="link" /> Superset with next</button>}
              {it.superset && <button type="button" onClick={() => setItems((l) => unlink(l, it.uid))}><Px name="link" /> Unlink</button>}
              {!it.note && !openNotes.includes(it.uid) && <button type="button" className="icon" onClick={() => setOpenNotes((n) => [...n, it.uid])} aria-label="Add note"><Px name="note" /></button>}
              {i > 0 && <button type="button" className="icon" onClick={() => setItems((l) => move(l, it.uid, -1))} aria-label="Move up"><Px name="up" /></button>}
              {i < draft.items.length - 1 && <button type="button" className="icon" onClick={() => setItems((l) => move(l, it.uid, 1))} aria-label="Move down"><Px name="down" /></button>}
              <button type="button" className="icon danger" onClick={() => setItems((l) => remove(l, it.uid))} aria-label={`Remove ${def.name}`}><Px name="trash" /></button>
            </div>
          </section>
        )
      })}

      <button type="button" className="btn primary wide" onClick={() => setPicker(true)}><Px name="plus" /> Add exercises</button>
      {original && (
        <button
          type="button"
          className="btn danger-ghost wide"
          onClick={async () => {
            if (await confirmDialog(`Delete the routine "${original.name}"? Past workouts are kept.`, 'Delete', true)) {
              deleteRoutine(original.id)
              onDone()
            }
          }}
        >
          <Px name="trash" /> Delete routine
        </button>
      )}

      {picker && (
        <ExercisePicker
          onClose={() => setPicker(false)}
          onPick={(ids) => {
            setItems((l) => [
              ...l,
              ...ids.map((exerciseId) => {
                const timed = exerciseById(exerciseId, s).type === 'duration'
                return { uid: uid(), exerciseId, superset: null, note: '', ...DEFAULT, ...(timed ? { repMin: 20, repMax: 45 } : {}) }
              }),
            ])
            setPicker(false)
          }}
        />
      )}
    </div>
  )
}
