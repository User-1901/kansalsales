import { useEffect, useRef } from 'react';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function ConfirmationDialog({ message, onConfirm, onCancel, isOpen }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    confirmRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-msg">
      <div className="modal">
        <p id="dialog-msg" style={{ marginTop: 0, fontSize: 15 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" ref={confirmRef} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
