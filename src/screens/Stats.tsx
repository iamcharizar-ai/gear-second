import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { GROUPS } from '../data/exercises'
import {
  PERIODS, PERIOD_DAYS, PERIOD_LABEL, WEEK_METRICS, WEEK_METRIC_LABEL, WEEK_METRIC_UNIT,
  groupSets, mainExercises, muscleSetsIn, periodRange, weekStreak, weeklySeries, workoutDays, workoutsIn,
  type Period, type WeekMetric,
} from '../lib/insights'
import { fmtDuration, workoutVolume } from '../lib/stats'
import { exerciseById, useStore } from '../lib/store'
import { BarChart, Calendar, Radar, Segmented } from '../components/Charts'
import { MuscleOverview } from '../components/MuscleOverview'

export function Stats({ onOpenSession, onOpenExercise }: { onOpenSession: (id: string) => void; onOpenExercise: (id: string) => void }) {
  const s = useStore()
  const [metric, setMetric] = useState<WeekMetric>('volume')
  const [period, setPeriod] = useState<Period>('30d')

  const range = useMemo(() => periodRange(period), [period])
  const prevRange = useMemo(() => periodRange(period, 1), [period])
  const inPeriod = workoutsIn(s, range)
  const sets = useMemo(() => muscleSetsIn(s, range), [s, range])
  const now = groupSets(sets)
  const before = groupSets(muscleSetsIn(s, prevRange))
  const main = mainExercises(s, range)
  const weeks = weeklySeries(s, metric)
  const volume = inPeriod.reduce((a, w) => a + workoutVolume(w, s), 0)
  const timeMs = inPeriod.reduce((a, w) => a + (new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()), 0)

  return (
    <div className="screen">
      <header className="pagebar"><h1>Stats</h1></header>

      {s.workouts.length === 0 && <p className="card empty">Finish a workout and your charts start filling in.</p>}

      <div className="tiles">
        <div className="tile yellow"><small>Week streak</small><b>{weekStreak(s)}</b></div>
        <div className="tile"><small>Workouts · {PERIOD_LABEL[period]}</small><b>{inPeriod.length}</b></div>
        <div className="tile"><small>Time · {PERIOD_LABEL[period]}</small><b>{fmtDuration(timeMs)}</b></div>
        <div className="tile"><small>Volume · {PERIOD_LABEL[period]}</small><b>{volume >= 10000 ? `${(volume / 1000).toFixed(1)}t` : `${volume} kg`}</b></div>
      </div>

      <section className="card">
        <div className="section-head"><h2>Last 12 weeks</h2></div>
        <Segmented value={metric} onChange={setMetric} label="Weekly metric" options={WEEK_METRICS.map((m) => ({ id: m, label: WEEK_METRIC_LABEL[m] }))} />
        <BarChart
          data={weeks.map(({ week, value }) => ({
            label: week.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            title: `Week of ${week.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
            value,
          }))}
          unit={WEEK_METRIC_UNIT[metric]}
        />
      </section>

      <section className="card">
        <div className="section-head"><h2>Calendar</h2></div>
        <Calendar days={workoutDays(s)} onOpen={onOpenSession} />
      </section>

      <div className="sticky-seg">
        <Segmented value={period} onChange={setPeriod} label="Period" options={PERIODS.map((p) => ({ id: p, label: PERIOD_LABEL[p] }))} />
      </div>

      <section className="card">
        <div className="section-head">
          <h2>Muscles</h2>
          <span className="muted">{PERIOD_LABEL[period]}{period === '7d' ? '' : ' · weekly avg'}</span>
        </div>
        <MuscleOverview sets={sets} weeks={PERIOD_DAYS[period] / 7} />
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Muscle distribution</h2>
          <span className="muted">sets vs previous {PERIOD_LABEL[period]}</span>
        </div>
        <Radar axes={GROUPS} current={GROUPS.map((g) => now[g])} previous={GROUPS.map((g) => before[g])} />
      </section>

      <section className="card">
        <div className="section-head"><h2>Main exercises</h2><span className="muted">{PERIOD_LABEL[period]}</span></div>
        {main.length === 0 && <p className="muted">Nothing logged in this period.</p>}
        <ul className="rows">
          {main.map((m) => (
            <li key={m.exerciseId}>
              <button type="button" className="row-btn" onClick={() => onOpenExercise(m.exerciseId)}>
                <span className="row-main"><b>{exerciseById(m.exerciseId, s).name}</b><small>{m.sessions} session{m.sessions > 1 ? 's' : ''}</small></span>
                <span className="row-val">{m.sets} sets</span>
                <ChevronRight size={18} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
