import { useEffect, useId } from 'react'
import { closeConfirm, useConfirm } from '../lib/confirm'

export function ConfirmHost() {
  const ask = useConfirm()
  const textId = useId()
  // on the document, not the dialog: Escape must cancel even if focus has left the buttons
  useEffect(() => {
    if (!ask) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConfirm(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ask])
  if (!ask) return null
  return (
    <div className="veil" onClick={() => closeConfirm(false)}>
      <div className="dialog confirm" role="alertdialog" aria-modal="true" aria-describedby={textId} onClick={(e) => e.stopPropagation()}>
        <p id={textId}>{ask.text}</p>
        <div className="row-end">
          <button type="button" className="btn" onClick={() => closeConfirm(false)}>Cancel</button>
          <button type="button" className={`btn ${ask.danger ? 'danger' : 'primary'}`} onClick={() => closeConfirm(true)} autoFocus>
            {ask.ok}
          </button>
        </div>
      </div>
    </div>
  )
}
