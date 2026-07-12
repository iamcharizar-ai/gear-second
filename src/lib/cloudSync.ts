// Ledger client — Strong ONLY ever inserts `workout` events (append-only).
// The event shape matches LifeOS v0.9: { type:'workout', at, session:<JSON> }
// so old clients fold +15 XP and ignore the richer payload. Offline inserts
// queue in an outbox and flush on next boot / next successful insert.
import { supabase, cloudOn } from './supabase'
import type { WorkoutSummary } from './workout'
import { mergeHistory } from './history'

const OUTBOX = 'strong.outbox.v1'
const DEVICE = 'strong.device.v1'

function deviceId(): string {
  let id = localStorage.getItem(DEVICE)
  if (!id) {
    id = 'strong-' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem(DEVICE, id)
  }
  return id
}

interface WorkoutRow {
  type: 'workout'
  at: string
  device: string
  session: string // JSON WorkoutSummary
}

function rowFor(w: WorkoutSummary): WorkoutRow {
  return { type: 'workout', at: w.finishedAt, device: deviceId(), session: JSON.stringify(w) }
}

function loadOutbox(): WorkoutRow[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX) || '[]') as WorkoutRow[]
  } catch {
    return []
  }
}
function saveOutbox(rows: WorkoutRow[]): void {
  localStorage.setItem(OUTBOX, JSON.stringify(rows))
}

async function flushOutbox(): Promise<void> {
  if (!supabase) return
  const rows = loadOutbox()
  if (!rows.length) return
  const { error } = await supabase.from('events').insert(rows)
  if (!error) saveOutbox([])
}

/** Fire-and-forget insert of a finished workout. Queues offline. Never throws. */
export async function pushWorkout(w: WorkoutSummary): Promise<void> {
  if (!cloudOn || !supabase) return
  const row = rowFor(w)
  try {
    await flushOutbox()
    const { error } = await supabase.from('events').insert(row)
    if (error) throw error
  } catch {
    saveOutbox([...loadOutbox(), row])
  }
}

/** Boot: flush any queued rows, then hydrate history from cloud workout events. */
export async function bootSync(): Promise<void> {
  if (!cloudOn || !supabase) return
  try {
    await flushOutbox()
    const { data } = await supabase
      .from('events')
      .select('session')
      .eq('type', 'workout')
      .not('session', 'is', null)
      .order('at', { ascending: false })
      .limit(500)
    if (data) {
      const summaries: WorkoutSummary[] = []
      for (const r of data as { session: string | null }[]) {
        if (!r.session) continue
        try {
          const s = JSON.parse(r.session) as WorkoutSummary
          if (s && Array.isArray(s.exercises)) summaries.push(s)
        } catch {
          /* skip malformed */
        }
      }
      if (summaries.length) mergeHistory(summaries)
    }
  } catch {
    /* offline — local history stands */
  }
}
