import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { EXERCISES, MUSCLE_LABEL } from '../config/exercises'

/** Bottom-sheet picker for adding an exercise mid-session. */
export function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (exerciseId: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return EXERCISES
    return EXERCISES.filter(
      (e) =>
        e.name.toLowerCase().includes(t) ||
        e.primary.some((m) => MUSCLE_LABEL[m].toLowerCase().includes(t)),
    )
  }, [q])

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom max-h-[80vh] rounded-t-card bg-card-2 p-4"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercise or muscle"
          className="mb-3 w-full rounded-full bg-card px-4 py-3 text-sm outline-none placeholder:text-faint"
        />
        <div className="max-h-[55vh] overflow-y-auto">
          {list.map((e) => (
            <button
              key={e.id}
              onClick={() => onPick(e.id)}
              className="flex w-full items-center justify-between border-b border-line/50 px-1 py-3 text-left last:border-0 active:bg-card"
            >
              <span className="font-medium">{e.name}</span>
              <span className="text-xs text-faint">{e.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}</span>
            </button>
          ))}
          {list.length === 0 && <div className="py-8 text-center text-sm text-faint">No match</div>}
        </div>
      </motion.div>
    </div>
  )
}
