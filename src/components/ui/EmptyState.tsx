import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';

export default function EmptyState() {
  const addProject = useProjectStore((s) => s.addProject);
  const [creating, setCreating] = useState(false);
  const [name, setName]         = useState('');
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  function handleSubmit(): void {
    if (name.trim()) {
      addProject(name.trim());
      setName('');
      setCreating(false);
    }
  }

  function handleCancel(): void {
    setName('');
    setCreating(false);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-[var(--bg-base)]">
      <img src="/logo.png" alt="Skein" className="w-16 h-16 opacity-80" />
      <div className="text-center">
        <p className="text-base font-semibold text-neutral-700 dark:text-neutral-200">
          Aucun projet pour l'instant
        </p>
        <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
          Crée ton premier projet pour commencer.
        </p>
      </div>

      {creating ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') handleCancel();
            }}
            placeholder="Nom du projet"
            className="px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 w-52"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-3 py-2 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            Créer
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-2 text-sm rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-[var(--bg-hover)] transition-colors"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
        >
          Créer un projet
        </button>
      )}
    </div>
  );
}
