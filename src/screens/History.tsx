import { useRef, useState } from 'react'
import { exerciseById, exportData, importData, useStore } from '../lib/store'
import { dateLabel, fmtDuration, prsIn, setCount, workoutVolume } from '../lib/stats'
import { Px } from '../components/Pixel'

export function History({ onOpenSession }: { onOpenSession: (id: string) => void }) {
  const s = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gear-second-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="screen">
      <header className="pagebar"><h1>History</h1></header>
      {s.workouts.length === 0 && <p className="empty">Finished workouts show up here.</p>}
      {s.workouts.map((w) => {
        const prs = prsIn(w, s).length
        return (
          <button key={w.id} type="button" className="card session" onClick={() => onOpenSession(w.id)}>
            <div className="session-top">
              <b>{w.name}</b>
              {prs > 0 && <span className="pr-badge"><Px name="trophy" /> {prs}</span>}
            </div>
            <small>{dateLabel(w.finishedAt)}</small>
            <div className="stats-row">
              <span><Px name="clock" /> {fmtDuration(new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime())}</span>
              <span><Px name="dumbbell" u={1.5} /> {workoutVolume(w, s).toLocaleString('en-IN')} kg</span>
              <span>{setCount(w)} sets</span>
            </div>
            <ul className="session-lines">
              {w.exercises.map((e, i) => (
                <li key={i}>{e.sets.length} × {exerciseById(e.exerciseId, s).name}</li>
              ))}
            </ul>
          </button>
        )
      })}

      <section className="backup">
        <h2>Backup</h2>
        <p className="muted">Workouts are saved on this device only for now. Export a copy now and then.</p>
        <div className="row">
          <button type="button" className="btn sm" onClick={download} disabled={!s.workouts.length && !s.custom.length}>Export</button>
          <button type="button" className="btn sm" onClick={() => file.current?.click()}>Import</button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              const err = importData(await f.text())
              setMsg(err ?? 'Backup imported.')
            }}
          />
        </div>
        {msg && <p className="muted">{msg}</p>}
      </section>
    </div>
  )
}
