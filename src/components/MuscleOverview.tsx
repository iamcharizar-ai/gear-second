import { useState } from 'react'
import { MUSCLE_LABEL } from '../data/exercises'
import type { MuscleSets } from '../lib/insights'
import { WEEKLY_SETS } from '../lib/stats'
import { WEEK_CUTS, heat } from '../lib/theme'
import type { Muscle } from '../lib/types'
import { BodyMap } from './BodyMap'

/**
 * Body heatmap. `sets` are totals over `weeks` weeks, shown as sets per week
 * so every period is judged against the same 10-20 hypertrophy band. Tapping
 * a muscle reads out its number. Trends over time live in Vitals.
 */
export function MuscleOverview({ sets, weeks = 1 }: { sets: MuscleSets; weeks?: number }) {
  const [sel, setSel] = useState<Muscle | null>(null)
  const perWeek = (m: Muscle) => (sets[m] ?? 0) / weeks
  const toggle = (m: Muscle) => setSel((cur) => (cur === m ? null : m))
  const unit = weeks > 1 ? 'avg sets / week' : 'sets'
  const n = sel ? Math.round(perWeek(sel) * 10) / 10 : 0

  return (
    <div className="overview">
      <BodyMap
        color={(m) => heat(perWeek(m), WEEK_CUTS)}
        selected={sel}
        onSelect={toggle}
        height={400}
        label={`Muscle heatmap, ${unit}`}
      />
      <div className="ramp-key" aria-hidden="true">
        <span>0</span>
        <i className="r0" /><i className="r1" /><i className="r2" /><i className="r3" /><i className="r4" />
        <span>20+ sets / wk</span>
      </div>
      {sel && (
        <div className="muscle-trend" aria-live="polite">
          <div className="section-head">
            <h3>{MUSCLE_LABEL[sel]}</h3>
            <button type="button" className="link" onClick={() => setSel(null)}>close</button>
          </div>
          <p>
            <b>{n}</b> {unit}.{' '}
            <span className="muted">
              {n < WEEKLY_SETS.min ? `Under the ${WEEKLY_SETS.min}-${WEEKLY_SETS.max} a week that builds muscle.` : n > WEEKLY_SETS.max ? `Over the ${WEEKLY_SETS.min}-${WEEKLY_SETS.max} a week band.` : `Inside the ${WEEKLY_SETS.min}-${WEEKLY_SETS.max} a week band.`}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
