import { useState, useRef, useEffect } from 'react';
import type { ZoomLevel, ViewMode } from '../../types/index';
import ColorPalettePanel from './ColorPalettePanel';

const ZOOM_LABELS: Record<ZoomLevel, string> = {
  day:   'Jour',
  week:  'Semaine',
  month: 'Mois',
};

const VIEW_LABELS: Record<ViewMode, string> = {
  gantt: 'Gantt',
  list:  'Liste',
};

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"  x2="12" y2="3"  />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

const DIVIDER = (
  <div className="w-px h-4 bg-[#E8E6E1] dark:bg-neutral-700 flex-none" />
);

interface Props {
  view:          ViewMode;
  onViewChange:  (v: ViewMode) => void;
  zoom:          ZoomLevel;
  onZoomChange:  (z: ZoomLevel) => void;
  dark:          boolean;
  onToggleDark:  () => void;
  onExportPng:   () => void;
  onExportPdf:   () => void;
  onExportJson:  () => void;
  isExporting:   boolean;
  hasProject:    boolean;
  onImportClick: () => void;
  onShare:       () => void;
  shareLabel:    string;
  // Largeur de colonne (vue Gantt uniquement)
  dayWidth:              number;
  dayWidthMin:           number;
  dayWidthMax:           number;
  onDayWidthChange:      (w: number) => void;
  // Plage temporelle (vue Gantt uniquement)
  timelineStart:         string | null; // override stocké (null = auto)
  timelineEnd:           string | null;
  effectiveStart:        string;        // valeur résolue à afficher
  effectiveEnd:          string;
  taskEarliestDate:      string | null; // borne max pour l'input début
  taskLatestDate:        string | null; // borne min pour l'input fin
  onTimelineRangeChange: (start: string | null, end: string | null) => void;
}

export default function Toolbar({
  view, onViewChange,
  zoom, onZoomChange,
  dark, onToggleDark,
  onExportPng, onExportPdf, onExportJson,
  isExporting, hasProject,
  onImportClick,
  onShare, shareLabel,
  dayWidth, dayWidthMin, dayWidthMax, onDayWidthChange,
  timelineStart, timelineEnd,
  effectiveStart, effectiveEnd,
  taskEarliestDate, taskLatestDate,
  onTimelineRangeChange,
}: Props) {
  const exportDisabled = !hasProject || isExporting;

  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    function onOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [exportOpen]);

  const btnBase  = 'px-3 py-1 text-xs font-medium rounded-xl transition-colors';
  const btnGhost = `${btnBase} text-neutral-600 dark:text-neutral-400 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700`;
  const btnIcon  = 'p-1.5 rounded-xl transition-colors text-neutral-500 dark:text-neutral-400 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700 hover:text-neutral-800 dark:hover:text-neutral-100';

  return (
    <div className="flex-none flex items-center gap-2 px-4 h-10 border-b border-[#E8E6E1] dark:border-neutral-700 bg-[#F8F7F4] dark:bg-neutral-800">

      {/* Sélecteur de vue : Gantt / Liste */}
      <div className="flex items-center gap-1">
        {(['gantt', 'list'] as ViewMode[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewChange(v)}
            className={[
              btnBase,
              view === v
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700',
            ].join(' ')}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {/* Zoom (vue Gantt uniquement) */}
      {view === 'gantt' && (
        <>
          {DIVIDER}
          <span className="text-xs text-neutral-400 dark:text-neutral-500 select-none">Zoom</span>
          <div className="flex items-center gap-1">
            {(['day', 'week', 'month'] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => onZoomChange(z)}
                className={[
                  btnBase,
                  zoom === z
                    ? 'bg-emerald-500 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700',
                ].join(' ')}
              >
                {ZOOM_LABELS[z]}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Largeur de colonne */}
      {view === 'gantt' && hasProject && (
        <>
          {DIVIDER}
          <input
            type="range"
            min={dayWidthMin}
            max={dayWidthMax}
            step={1}
            value={Math.round(dayWidth)}
            onChange={(e) => onDayWidthChange(Number(e.target.value))}
            className="w-20 accent-emerald-500 cursor-pointer"
            title={`Largeur : ${Math.round(dayWidth)} px/jour`}
          />
        </>
      )}

      {/* Plage temporelle (vue Gantt + projet actif) */}
      {view === 'gantt' && hasProject && (
        <>
          {DIVIDER}
          <span className="text-xs text-neutral-400 dark:text-neutral-500 select-none">Plage</span>
          <input
            type="date"
            value={effectiveStart}
            onChange={(e) =>
              onTimelineRangeChange(e.target.value || null, timelineEnd)
            }
            className="text-xs px-2 py-1 rounded-xl border border-[#E8E6E1] dark:border-neutral-700 bg-[#F8F7F4] dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <span className="text-xs text-neutral-400 dark:text-neutral-500 select-none">→</span>
          <input
            type="date"
            value={effectiveEnd}
            onChange={(e) =>
              onTimelineRangeChange(timelineStart, e.target.value || null)
            }
            className="text-xs px-2 py-1 rounded-xl border border-[#E8E6E1] dark:border-neutral-700 bg-[#F8F7F4] dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          {(timelineStart !== null || timelineEnd !== null) && (
            <button
              type="button"
              title="Réinitialiser la plage automatiquement"
              onClick={() => onTimelineRangeChange(null, null)}
              className="text-xs px-1.5 py-1 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700 transition-colors"
            >
              ↺
            </button>
          )}
        </>
      )}

      {/* Droite : dark toggle | Import | Export */}
      <div className="ml-auto flex items-center gap-2">

        {/* Toggle dark / light */}
        <button
          type="button"
          onClick={onToggleDark}
          title={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className={btnIcon}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Palette de couleurs */}
        <ColorPalettePanel />

        {DIVIDER}

        {/* Import */}
        <button type="button" onClick={onImportClick} className={btnGhost}>
          Importer
        </button>

        {DIVIDER}

        {/* Partager */}
        <button
          type="button"
          onClick={onShare}
          disabled={!hasProject}
          className={`${btnGhost} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {shareLabel}
        </button>

        {DIVIDER}

        {/* Export — dropdown */}
        <div ref={exportRef} className="relative">
          <button
            type="button"
            disabled={exportDisabled}
            onClick={() => setExportOpen((o) => !o)}
            className={`${btnGhost} disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1`}
          >
            {isExporting ? 'Export…' : 'Exporter'}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div
            className={[
              'absolute right-0 top-full mt-1 z-50 min-w-[110px] rounded-xl border border-[#E8E6E1] dark:border-neutral-700 bg-[#F8F7F4] dark:bg-neutral-800 shadow-lg py-1 overflow-hidden',
              'transition-all duration-150 ease-out origin-top-right',
              exportOpen
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-95 -translate-y-1 pointer-events-none',
            ].join(' ')}
          >
            {view === 'gantt' && (
              <>
                <button
                  type="button"
                  onClick={() => { onExportPng(); setExportOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700 transition-colors"
                >
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => { onExportPdf(); setExportOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700 transition-colors"
                >
                  PDF
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => { onExportJson(); setExportOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700 transition-colors"
            >
              JSON
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
