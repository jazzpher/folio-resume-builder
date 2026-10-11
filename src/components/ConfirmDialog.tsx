import { useEffect, useRef } from 'react';

export type Confirm = { text: string; run: () => void };

/**
 * Native modal <dialog>: showModal() traps focus and makes the page inert, Escape cancels,
 * and focus goes back to whatever was focused before it opened.
 */
export function ConfirmDialog({ confirm, onClose }: { confirm: Confirm; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    cancel.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-text"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 id="confirm-title">Just checking</h2>
      <p id="confirm-text">{confirm.text}</p>
      <div>
        <button ref={cancel} onClick={onClose}>
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
    </dialog>
  );
}
