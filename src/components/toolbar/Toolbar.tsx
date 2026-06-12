import type { ZoomLevel } from '../../types/index';

const ZOOM_LABELS: Record<ZoomLevel, string> = {
  day:   'Jour',
  week:  'Semaine',
  month: 'Mois',
};

interface Props {
  zoom: ZoomLevel;
  onZoomChange: (z: ZoomLevel) => void;
}

export default function Toolbar({ zoom, onZoomChange }: Props) {
  return (
    <div className="flex-none flex items-center gap-1 px-6 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <span className="text-xs text-neutral-400 dark:text-neutral-500 mr-2">Zoom</span>
      {(['day', 'week', 'month'] as ZoomLevel[]).map((z) => (
        <button
          key={z}
          type="button"
          onClick={() => onZoomChange(z)}
          className={[
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            zoom === z
              ? 'bg-emerald-500 text-white'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
          ].join(' ')}
        >
          {ZOOM_LABELS[z]}
        </button>
      ))}
    </div>
  );
}
