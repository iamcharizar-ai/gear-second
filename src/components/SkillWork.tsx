import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { targetFor } from '../arbor-core/coach.ts'
import { dayISO, practicedOn, valueOf } from '../arbor-core/model.ts'
import { ensurePlanPublished, gymSkillsToday, logSkill, useStore, useSync } from '../lib/store'

/**
 * Calisthenics skills the Arbor coach wants practised at the gym today (things
 * that need a high bar, rings or dip bars). Ticking one logs the practice to
 * the shared ledger, so Arbor and Life OS see it; typing a number first also
 * records a new best.
 */
export function SkillWork() {
  const s = useStore()
  const sync = useSync()
  const skills = gymSkillsToday(s)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const day = dayISO()

  // Freeze today's plan once we know no other device has, so every app agrees on it.
  useEffect(() => { ensurePlanPublished() }, [sync.status])

  if (!skills.length) return null
  return (
    <section className="card skillwork">
      <div className="section-head">
        <h2>Skill work</h2>
        <span className="muted">from Arbor · do these fresh</span>
      </div>
      {skills.map((sk) => {
        const done = practicedOn(s.arbor, day, sk.id)
        const cur = valueOf(sk, s.arbor.progress[sk.id])
        return (
          <div key={sk.id} className={`skill-row ${done ? 'done' : ''}`}>
            <div className="skill-main">
              <b>{sk.name}</b>
              <small>{targetFor(sk, s.arbor.progress)}</small>
            </div>
            {sk.unit && (
              <input
                inputMode="numeric"
                aria-label={`New best ${sk.unit} for ${sk.name}`}
                placeholder={cur ? String(cur) : sk.unit}
                value={drafts[sk.id] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [sk.id]: e.target.value.replace(/[^\d.]/g, '').slice(0, 5) }))}
              />
            )}
            <button
              type="button"
              className="tick"
              aria-pressed={done}
              aria-label={`${sk.name} practised`}
              onClick={() => {
                const n = Number(drafts[sk.id])
                logSkill(sk.id, !done, !done && drafts[sk.id] && n > cur ? n : undefined)
                setDrafts((d) => ({ ...d, [sk.id]: '' }))
              }}
            >
              <Check size={18} strokeWidth={2.75} aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </section>
  )
}
