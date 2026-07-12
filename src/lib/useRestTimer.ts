// Rest timer that actually alerts: counts down, and at zero fires a vibration
// + a local notification (web APIs in v0.1; Capacitor Haptics/LocalNotifications
// swap in at the v0.2 native wrap). A wake-lock is held while a session is open
// so the screen-off case still buzzes on device.
import { useCallback, useEffect, useRef, useState } from 'react'

export function ensureNotifyPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    void Notification.requestPermission()
  }
}

function alertRestDone(): void {
  if ('vibrate' in navigator) navigator.vibrate([180, 90, 180])
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Rest complete 💪', { body: 'Next set — go.', silent: false })
    } catch {
      /* some browsers require a SW registration; vibration still fired */
    }
  }
}

export interface RestTimer {
  active: boolean
  remaining: number
  total: number
  start: (seconds: number) => void
  stop: () => void
  bump: (delta: number) => void
}

export function useRestTimer(): RestTimer {
  const [total, setTotal] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [active, setActive] = useState(false)
  const endRef = useRef<number>(0)
  const raf = useRef<number>(0)

  const tick = useCallback(() => {
    const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
    setRemaining(left)
    if (left <= 0) {
      setActive(false)
      alertRestDone()
      return
    }
    raf.current = window.setTimeout(tick, 250)
  }, [])

  const start = useCallback(
    (seconds: number) => {
      window.clearTimeout(raf.current)
      endRef.current = Date.now() + seconds * 1000
      setTotal(seconds)
      setRemaining(seconds)
      setActive(true)
      raf.current = window.setTimeout(tick, 250)
    },
    [tick],
  )

  const stop = useCallback(() => {
    window.clearTimeout(raf.current)
    setActive(false)
    setRemaining(0)
  }, [])

  const bump = useCallback((delta: number) => {
    endRef.current += delta * 1000
    setTotal((t) => Math.max(5, t + delta))
    setRemaining(Math.max(0, Math.round((endRef.current - Date.now()) / 1000)))
  }, [])

  useEffect(() => () => window.clearTimeout(raf.current), [])

  return { active, remaining, total, start, stop, bump }
}
