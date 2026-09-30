import { closeConfirm, useConfirm } from '../lib/confirm'

export function ConfirmHost() {
  const ask = useConfirm()
  if (!ask) return null
  return (
    <div className="veil" onClick={() => closeConfirm(false)}>
      <div className="dialog confirm" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p>{ask.text}</p>
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
