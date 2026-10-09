// Each workout in the split earns its own item, drawn from the same sprite set
// Pokedex uses. None of these are used there for a domain mark, a currency, a
// shard, a ball, a held item or a shop good, so they never collide.
export interface Reward {
  name: string
  /** file in public/rewards (named for the item, as in Pokedex) */
  icon: string
}

export const REWARDS: Record<string, Reward> = {
  'd1-chest-delts': { name: 'Protector', icon: 'protector' },
  'd2-lats-biceps': { name: 'Silver Wing', icon: 'silver-wing' },
  'd3-legs': { name: 'Power Anklet', icon: 'power-anklet' },
  'd4-delts-triceps': { name: 'Power Lens', icon: 'power-lens' },
  'd5-back-biceps': { name: 'Power Bracer', icon: 'power-bracer' },
  'd6-chest-flys': { name: 'Power Band', icon: 'power-band' },
  'd7-arms-delts': { name: 'Power Weight', icon: 'power-weight' },
}

/** Older saved routines and workouts still carry a "Mon · " style prefix. */
export const cleanName = (name: string): string => name.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) · /, '')
