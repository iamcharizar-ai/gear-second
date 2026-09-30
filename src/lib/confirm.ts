import { useSyncExternalStore } from 'react'

// Promise-based confirm dialog in the app's own style (window.confirm can't be styled).
export interface Ask {
  text: string
  ok: string
  danger: boolean
  resolve: (v: boolean) => void
}

let current: Ask | null = null
const ls = new Set<() => void>()
const emit = () => ls.forEach((l) => l())

export function confirmDialog(text: string, ok = 'OK', danger = false): Promise<boolean> {
  current?.resolve(false)
  return new Promise((resolve) => {
    current = { text, ok, danger, resolve }
    emit()
  })
}

export function closeConfirm(v: boolean) {
  current?.resolve(v)
  current = null
  emit()
}

export const useConfirm = () =>
  useSyncExternalStore((l) => { ls.add(l); return () => { ls.delete(l) } }, () => current)
