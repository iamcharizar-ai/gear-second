import { useEffect, useMemo, useRef, useState } from 'react'
import { MUSCLES, MUSCLE_LABEL, TYPE_LABEL } from '../data/exercises'
import { addCustomExercise, allExercises, useStore } from '../lib/store'
import type { Equipment, ExType, Muscle } from '../lib/types'
import { Px } from './Pixel'

const EQUIPMENT: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'smith', 'ez-bar', 'other']

/**
 * Full-screen exercise chooser. `multi` lets you tick several and add them in
 * one go (building a workout); single mode picks immediately (replace).
 */
export function ExercisePicker({
  multi = true,
  onPick,
  onClose,
}: {
  multi?: boolean
  onPick: (ids: string[]) => void
  onClose: () => void
}) {
  const s = useStore()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { input.current?.focus() }, [])

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return allExercises(s)
      .filter((e) => !muscle || e.primary.includes(muscle) || e.secondary.includes(muscle))
      .filter((e) => !needle || needle.split(/\s+/).every((w) => `${e.name} ${e.equipment}`.toLowerCase().includes(w)))
      .sort((a, b) => {
        // primary-muscle matches first when filtering by muscle
        if (muscle) {
          const pa = a.primary.includes(muscle) ? 0 : 1, pb = b.primary.includes(muscle) ? 0 : 1
          if (pa !== pb) return pa - pb
        }
        return a.name.localeCompare(b.name)
      })
  }, [s, q, muscle])

  const toggle = (id: string) => {
    if (!multi) return onPick([id])
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  if (creating) {
    return (
      <CreateExercise
        initialName={q}
        onCancel={() => setCreating(false)}
        onCreated={(id) => { setCreating(false); if (multi) setPicked((p) => [...p, id]); else onPick([id]) }}
      />
    )
  }

  return (
    <div className="sheet">
      <header className="sheet-head">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Px name="close" /></button>
        <h2>{multi ? 'Add exercises' : 'Replace exercise'}</h2>
        {multi && (
          <button type="button" className="btn primary sm" disabled={!picked.length} onClick={() => onPick(picked)}>
            Add{picked.length ? ` ${picked.length}` : ''}
          </button>
        )}
      </header>
      <div className="search">
        <Px name="search" />
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises" aria-label="Search exercises" />
      </div>
      <div className="chips scroll-x" role="group" aria-label="Filter by muscle">
        <button type="button" className={`chip ${!muscle ? 'on' : ''}`} onClick={() => setMuscle(null)}>All</button>
        {MUSCLES.map((m) => (
          <button key={m} type="button" className={`chip ${muscle === m ? 'on' : ''}`} onClick={() => setMuscle(muscle === m ? null : m)}>
            {MUSCLE_LABEL[m]}
          </button>
        ))}
      </div>
      <ul className="pick-list">
        {list.map((e) => {
          const on = picked.includes(e.id)
          return (
            <li key={e.id}>
              <button type="button" className={`pick-row ${on ? 'on' : ''}`} onClick={() => toggle(e.id)} aria-pressed={multi ? on : undefined}>
                <span className="pick-main">
                  <span className="pick-name">{e.name}</span>
                  <span className="pick-sub">{e.primary.map((m) => MUSCLE_LABEL[m]).join(', ')} · {e.equipment}</span>
                </span>
                {multi && <span className="tick">{on && <Px name="check" />}</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <button type="button" className="btn ghost wide" onClick={() => setCreating(true)}>
        <Px name="plus" /> Create {q.trim() ? `"${q.trim()}"` : 'custom exercise'}
      </button>
    </div>
  )
}

function CreateExercise({ initialName, onCancel, onCreated }: { initialName: string; onCancel: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState(initialName.trim())
  const [type, setType] = useState<ExType>('weight')
  const [equipment, setEquipment] = useState<Equipment>('dumbbell')
  const [primary, setPrimary] = useState<Muscle>('chest')
  const save = () => {
    if (!name.trim()) return
    onCreated(addCustomExercise({ name: name.trim(), type, equipment, primary: [primary], secondary: [] }).id)
  }
  return (
    <div className="sheet">
      <header className="sheet-head">
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="Back"><Px name="back" /></button>
        <h2>New exercise</h2>
        <button type="button" className="btn primary sm" disabled={!name.trim()} onClick={save}>Save</button>
      </header>
      <div className="form">
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
        <label>Logged as
          <select value={type} onChange={(e) => setType(e.target.value as ExType)}>
            {(Object.keys(TYPE_LABEL) as ExType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label>Equipment
          <select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
            {EQUIPMENT.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </label>
        <label>Main muscle
          <select value={primary} onChange={(e) => setPrimary(e.target.value as Muscle)}>
            {MUSCLES.map((m) => <option key={m} value={m}>{MUSCLE_LABEL[m]}</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}
