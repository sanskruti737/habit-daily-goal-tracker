import Icon from './Icon.jsx';

export default function ConfirmDialog({ habit, onConfirm, onClose, busy }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="modal modal--confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="confirm-icon"><Icon name="trash" size={22} /></div>
        <h2 id="confirm-title">Delete this habit?</h2>
        <p>
          <strong>{habit.name}</strong> and its entire completion history will be permanently removed.
          This action cannot be undone.
        </p>
        <div className="modal__actions">
          <button className="button button--ghost" type="button" onClick={onClose} disabled={busy}>
            Keep habit
          </button>
          <button className="button button--danger" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting...' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
