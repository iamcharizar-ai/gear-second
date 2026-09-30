import { useState } from 'react'
import { MUSCLES, MUSCLE_LABEL } from '../data/exercises'
import { muscleWeekly, type MuscleSets } from '../lib/insights'
import { WEEKLY_SETS } from '../lib/stats'
import { useStore } from '../lib/store'
import { WEEK_CUTS, heat } from '../lib/theme'
import type { Muscle } from '../lib/types'
import { BodyMap } from './BodyMap'
import { BarChart, MuscleBars } from './Charts'

/**
 * Body heatmap with a bar per muscle underneath. `sets` are totals over
 * `weeks` weeks; everything is shown as sets per week so every period is
 * judged against the same 10-20 hypertrophy band. Tapping a muscle (on the
 * body or its bar) opens that muscle's 12-week trend.
 */
export function MuscleOverview({ sets, weeks = 1 }: { sets: MuscleSets; weeks?: number }) {
  const s = useStore()
  const [sel, setSel] = useState<Muscle | null>(null)
  const perWeek = (m: Muscle) => (sets[m] ?? 0) / weeks
  const toggle = (m: Muscle) => setSel((cur) => (cur === m ? null : m))
  const unit = weeks > 1 ? 'avg sets / week' : 'sets'

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
        <div className="muscle-trend">
          <div className="section-head">
            <h3>{MUSCLE_LABEL[sel]}</h3>
            <button type="button" className="link" onClick={() => setSel(null)}>close</button>
          </div>
          <BarChart
            data={muscleWeekly(s, sel).map(({ week, value }) => ({
              label: week.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
              title: `Week of ${week.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
              value,
            }))}
            unit="sets"
            band={[WEEKLY_SETS.min, WEEKLY_SETS.max]}
          />
        </div>
      )}
      <MuscleBars
        rows={MUSCLES.map((m) => ({ key: m, label: MUSCLE_LABEL[m], value: perWeek(m) }))}
        target={[WEEKLY_SETS.min, WEEKLY_SETS.max]}
        selected={sel}
        onSelect={toggle}
        unit={unit}
      />
    </div>
  )
}
