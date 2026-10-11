export type Confirm = { text: string; run: () => void };

export function ConfirmDialog({ confirm, onClose }: { confirm: Confirm; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="modal">
        <h2 id="confirm-title">Just checking</h2>
        <p>{confirm.text}</p>
        <div>
          <button autoFocus onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary"
            onClick={() => {
              confirm.run();
              onClose();
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
