import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-label={title}
      className="m-0 max-h-[85dvh] w-full max-w-lg self-end rounded-t-3xl border-2 border-line bg-surface p-0 text-ink backdrop:bg-black/50 sm:m-auto sm:self-center sm:rounded-3xl"
      style={{ marginInline: 'auto', marginBlockStart: 'auto' }}
    >
      <div className="sticky top-0 flex items-center gap-3 border-b-2 border-line bg-surface px-4 py-3">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto grid h-11 w-11 place-items-center rounded-full border-2 border-line text-lg"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="overflow-y-auto px-4 py-4">{children}</div>
    </dialog>
  );
}
