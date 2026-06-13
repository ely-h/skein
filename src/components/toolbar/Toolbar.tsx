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

interface Props {
  view:          ViewMode;
  onViewChange:  (v: ViewMode) => void;
  zoom:          ZoomLevel;
  onZoomChange:  (z: ZoomLevel) => void;
  onExportPng:   () => void;
  onExportPdf:   () => void;
  onExportJson:  () => void;
  isExporting:   boolean;
  hasProject:    boolean;
}

export default function Toolbar({
  view, onViewChange,
  zoom, onZoomChange,
  onExportPng, onExportPdf, onExportJson,
  isExporting, hasProject,
}: Props) {
  const exportDisabled = !hasProject || isExporting;

  return (
    <div className="flex-none flex items-center gap-3 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">

      {/* Sélecteur de vue : Gantt / Liste */}
      <div className="flex items-center gap-1">
        {(['gantt', 'list'] as ViewMode[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewChange(v)}
            className={[
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              view === v
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700',
            ].join(' ')}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {/* Contrôles de zoom (uniquement en vue Gantt) */}
      {view === 'gantt' && (
        <>
          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />
          <span className="text-xs text-neutral-400 dark:text-neutral-500">Zoom</span>
          <div className="flex items-center gap-1">
            {(['day', 'week', 'month'] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => onZoomChange(z)}
                className={[
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
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

      {/* Export — poussé à droite */}
      <div className="ml-auto flex items-center gap-1">
        <span className="text-xs text-neutral-400 dark:text-neutral-500 mr-1">
          {isExporting ? 'Export…' : 'Export'}
        </span>

        {view === 'gantt' && (
          <>
            <button
              type="button"
              onClick={onExportPng}
              disabled={exportDisabled}
              className="px-3 py-1 text-xs font-medium rounded-md transition-colors text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              PNG
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              disabled={exportDisabled}
              className="px-3 py-1 text-xs font-medium rounded-md transition-colors text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              PDF
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onExportJson}
          disabled={exportDisabled}
          className="px-3 py-1 text-xs font-medium rounded-md transition-colors text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          JSON
        </button>
      </div>

    </div>
  );
}
