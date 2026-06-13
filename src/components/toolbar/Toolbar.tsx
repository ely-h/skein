import type { ZoomLevel, ViewMode } from '../../types/index';

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
  <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 flex-none" />
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
}

export default function Toolbar({
  view, onViewChange,
  zoom, onZoomChange,
  dark, onToggleDark,
  onExportPng, onExportPdf, onExportJson,
  isExporting, hasProject,
  onImportClick,
}: Props) {
  const exportDisabled = !hasProject || isExporting;

  const btnBase  = 'px-3 py-1 text-xs font-medium rounded-md transition-colors';
  const btnGhost = `${btnBase} text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700`;
  const btnIcon  = 'p-1.5 rounded-md transition-colors text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-800 dark:hover:text-neutral-100';

  return (
    <div className="flex-none flex items-center gap-2 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">

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
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700',
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
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700',
                ].join(' ')}
              >
                {ZOOM_LABELS[z]}
              </button>
            ))}
          </div>
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

        {DIVIDER}

        {/* Import */}
        <button type="button" onClick={onImportClick} className={btnGhost}>
          Importer
        </button>

        {DIVIDER}

        {/* Export */}
        <span className="text-xs text-neutral-400 dark:text-neutral-500 select-none">
          {isExporting ? 'Export…' : 'Export'}
        </span>

        {view === 'gantt' && (
          <>
            <button
              type="button"
              onClick={onExportPng}
              disabled={exportDisabled}
              className={`${btnGhost} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              PNG
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              disabled={exportDisabled}
              className={`${btnGhost} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              PDF
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onExportJson}
          disabled={exportDisabled}
          className={`${btnGhost} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          JSON
        </button>

      </div>
    </div>
  );
}
