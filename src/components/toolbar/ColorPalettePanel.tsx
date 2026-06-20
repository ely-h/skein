import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import type { TaskStatus } from '../../types/index';

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog:     'Backlog',
  not_started: 'Pas commencé',
  in_progress: 'En cours',
  in_review:   'En validation',
  blocked:     'Bloqué',
  done:        'Terminé',
};

const STATUSES: TaskStatus[] = ['backlog', 'not_started', 'in_progress', 'in_review', 'blocked', 'done'];

function PaletteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      <circle cx="8"    cy="9"    r="1" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="6.5"  r="1" fill="currentColor" stroke="none" />
      <circle cx="17"   cy="10"   r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15"   r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function ColorPalettePanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const statusColors   = useThemeStore((s) => s.statusColors);
  const setStatusColor = useThemeStore((s) => s.setStatusColor);
  const resetColors    = useThemeStore((s) => s.resetColors);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const btnIcon = 'p-1.5 rounded-xl transition-colors text-neutral-500 dark:text-neutral-400 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700 hover:text-neutral-800 dark:hover:text-neutral-100';

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Palette de couleurs"
        className={btnIcon}
      >
        <PaletteIcon />
      </button>

      <div
        className={[
          'absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-[#E8E6E1] dark:border-neutral-700 bg-[#F8F7F4] dark:bg-neutral-800 shadow-lg py-2',
          'transition-all duration-150 ease-out origin-top-right',
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none',
        ].join(' ')}
      >
        <p className="px-3 pb-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider select-none">
          Couleurs des barres
        </p>

        {STATUSES.map((status) => (
          <label
            key={status}
            className="flex items-center justify-between px-3 py-1.5 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700/50 cursor-pointer transition-colors"
          >
            <span className="text-xs text-neutral-700 dark:text-neutral-300 select-none">
              {STATUS_LABELS[status]}
            </span>
            {/* Swatch colorée cliquable avec l'input color invisible par-dessus */}
            <div
              className="relative w-7 h-7 rounded-md border-2 border-white/60 dark:border-neutral-600 shadow-sm overflow-hidden flex-none"
              style={{ backgroundColor: statusColors[status] }}
            >
              <input
                type="color"
                value={statusColors[status]}
                onChange={(e) => setStatusColor(status, e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </label>
        ))}

        <div className="mt-1.5 px-3 pt-1.5 border-t border-[#E8E6E1] dark:border-neutral-700">
          <button
            type="button"
            onClick={resetColors}
            className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            Réinitialiser les couleurs
          </button>
        </div>
      </div>
    </div>
  );
}
