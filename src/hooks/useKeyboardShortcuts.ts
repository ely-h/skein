import { useEffect } from 'react';

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  );
}

interface Options {
  selectedId:  string | null; // unique tâche sélectionnée, null sinon
  onUndo:      () => void;
  onRedo:      () => void;
  onEscape:    () => void;    // désélectionner + fermer modale
  onDeleteKey: () => void;    // appelé uniquement si selectedId !== null
}

export function useKeyboardShortcuts({
  selectedId,
  onUndo,
  onRedo,
  onEscape,
  onDeleteKey,
}: Options): void {
  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      if (isInputFocused()) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        onUndo();
        return;
      }

      if ((ctrl && e.key === 'y') || (ctrl && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        onRedo();
        return;
      }

      if (e.key === 'Escape') {
        onEscape();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
        e.preventDefault();
        onDeleteKey();
        return;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, onUndo, onRedo, onEscape, onDeleteKey]);
}
