// List operations shared by the live workout and the routine editor. Items
// with the same `superset` id must sit next to each other; every edit is
// followed by `normalize`, which splits groups that lost contiguity and drops
// groups left with a single member.
import { uid } from './store'

interface Item {
  uid: string
  superset: string | null
}

export function normalize<T extends Item>(list: T[]): T[] {
  const seen = new Set<string>()
  const out = list.map((it, i) => {
    const id = it.superset
    if (!id) return it
    const prevSame = i > 0 && list[i - 1].superset === id
    if (!prevSame && seen.has(id)) return { ...it, superset: null } // a stray, split off from its run
    seen.add(id)
    return it
  })
  return out.map((it, i) => {
    if (!it.superset) return it
    const alone = out[i - 1]?.superset !== it.superset && out[i + 1]?.superset !== it.superset
    return alone ? { ...it, superset: null } : it
  })
}

/** Join an item with the one below it (extending an existing group if either has one). */
export function linkNext<T extends Item>(list: T[], id: string): T[] {
  const i = list.findIndex((x) => x.uid === id)
  if (i < 0 || i === list.length - 1) return list
  const group = list[i].superset ?? list[i + 1].superset ?? 'ss-' + uid()
  const old = [list[i].superset, list[i + 1].superset].filter(Boolean)
  return normalize(list.map((x, k) => (k === i || k === i + 1 || (x.superset && old.includes(x.superset)) ? { ...x, superset: group } : x)))
}

export function unlink<T extends Item>(list: T[], id: string): T[] {
  return normalize(list.map((x) => (x.uid === id ? { ...x, superset: null } : x)))
}

/** Move an item up/down; a whole superset moves as one block past its neighbours. */
export function move<T extends Item>(list: T[], id: string, dir: -1 | 1): T[] {
  const i = list.findIndex((x) => x.uid === id)
  if (i < 0) return list
  const j = i + dir
  if (j < 0 || j >= list.length) return list
  const next = list.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  // Swapping inside a group keeps the group; swapping out of it splits it (normalize handles that).
  return normalize(next)
}

export function remove<T extends Item>(list: T[], id: string): T[] {
  return normalize(list.filter((x) => x.uid !== id))
}

const COLORS = ['var(--straw)', 'var(--sea)', 'var(--red)', 'var(--orange)']

/** Letter + colour for each superset in display order. */
export function supersetLabels<T extends Item>(list: T[]): Map<string, { letter: string; color: string }> {
  const m = new Map<string, { letter: string; color: string }>()
  for (const it of list) {
    if (it.superset && !m.has(it.superset)) {
      const n = m.size
      m.set(it.superset, { letter: String.fromCharCode(65 + n), color: COLORS[n % COLORS.length] })
    }
  }
  return m
}
