import { addDays, parseDate } from '../../lib/dates';
import type { TimelineConfig } from '../../lib/timeline';
import type { ZoomLevel } from '../../types/index';
import { ROW_H } from './constants';

interface Props {
  config:   TimelineConfig;
  zoom:     ZoomLevel;
  rowCount: number;
}

export default function GanttGrid({ config, zoom, rowCount }: Props) {
  const totalH = rowCount * ROW_H;

  // ── Vue Jour : une colonne = 1 jour, week-ends grisés ───────────────────────
  if (zoom === 'day') {
    return (
      <div
        className="absolute top-0 pointer-events-none"
        style={{ left: 0, width: config.totalDays * config.dayWidth, height: totalH }}
      >
        {Array.from({ length: config.totalDays }, (_, i) => {
          const date      = parseDate(addDays(config.startDate, i));
          const dow       = date.getDay();
          const isWeekend = dow === 0 || dow === 6;
          return (
            <div
              key={i}
              className={[
                'absolute top-0 h-full border-r border-[#E8E6E1] dark:border-neutral-700',
                isWeekend ? 'bg-[#F0EDE8] dark:bg-neutral-900/50' : '',
              ].join(' ')}
              style={{ left: i * config.dayWidth, width: config.dayWidth }}
            />
          );
        })}
      </div>
    );
  }

  // ── Vue Semaine : une colonne = 7 jours, alternance légère pair/impair ──────
  if (zoom === 'week') {
    const cols: { left: number; width: number; shaded: boolean }[] = [];
    for (let i = 0; i < config.totalDays; i += 7) {
      const span  = Math.min(7, config.totalDays - i);
      const index = i / 7;
      cols.push({ left: i * config.dayWidth, width: span * config.dayWidth, shaded: index % 2 === 1 });
    }
    return (
      <div
        className="absolute top-0 pointer-events-none"
        style={{ left: 0, width: config.totalDays * config.dayWidth, height: totalH }}
      >
        {cols.map((col, idx) => (
          <div
            key={idx}
            className={[
              'absolute top-0 h-full border-r border-[#E8E6E1] dark:border-neutral-700',
              col.shaded ? 'bg-[#F0EDE8] dark:bg-neutral-900/50' : '',
            ].join(' ')}
            style={{ left: col.left, width: col.width }}
          />
        ))}
      </div>
    );
  }

  // ── Vue Mois : une colonne = 1 mois, alternance légère ────────────────────
  const cols: { left: number; width: number; shaded: boolean }[] = [];
  let i = 0;
  let monthIdx = 0;
  while (i < config.totalDays) {
    const date = parseDate(addDays(config.startDate, i));
    const y    = date.getFullYear();
    const m    = date.getMonth();
    let span   = 0;
    while (i + span < config.totalDays) {
      const d = parseDate(addDays(config.startDate, i + span));
      if (d.getFullYear() !== y || d.getMonth() !== m) break;
      span++;
    }
    cols.push({ left: i * config.dayWidth, width: span * config.dayWidth, shaded: monthIdx % 2 === 1 });
    i += span;
    monthIdx++;
  }

  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{ left: 0, width: config.totalDays * config.dayWidth, height: totalH }}
    >
      {cols.map((col, idx) => (
        <div
          key={idx}
          className={[
            'absolute top-0 h-full border-r border-[#E8E6E1] dark:border-neutral-700',
            col.shaded ? 'bg-[#F0EDE8] dark:bg-neutral-900/50' : '',
          ].join(' ')}
          style={{ left: col.left, width: col.width }}
        />
      ))}
    </div>
  );
}
