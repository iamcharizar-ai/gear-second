import { REWARDS } from '../data/rewards'

/** The item a routine earns, or nothing for routines you made yourself. */
export function RewardIcon({ routineId, size = 40 }: { routineId: string | null | undefined; size?: number }) {
  const r = routineId ? REWARDS[routineId] : undefined
  if (!r) return null
  return <img className="reward" src={`/rewards/${r.icon}.png`} width={size} height={size} alt={r.name} title={r.name} draggable={false} />
}
