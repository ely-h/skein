import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { addDays, parseDate } from '../../lib/dates';
import type { TimelineConfig } from '../../lib/timeline';
import { HEADER_DAY_H, HEADER_WEEK_H } from './constants';

interface WeekGroup {
  label: string;
  span: number;
  key: number;
}

function buildWeekGroups(config: TimelineConfig): WeekGroup[] {
  const groups: WeekGroup[] = [];
  let i = 0;
  while (i < config.totalDays) {
    const date = parseDate(addDays(config.startDate, i));
    const dow = date.getDay(); // 0=dim … 6=sam
    const isoWeekDay = dow === 0 ? 7 : dow; // 1=lun … 7=dim
    const daysToNextMon = isoWeekDay === 1 ? 7 : 8 - isoWeekDay;
    const span = Math.min(daysToNextMon, config.totalDays - i);
    groups.push({ label: format(date, 'd MMM', { locale: fr }), span, key: i });
    i += span;
  }
  return groups;
}

export default function GanttHeader({ config }: { config: TimelineConfig }) {
  const weeks = buildWeekGroups(config);

  return (
    <div className="flex-none select-none" style={{ width: config.totalDays * config.dayWidth }}>
      {/* Ligne semaines */}
      <div
        className="flex border-b border-neutral-200 dark:border-neutral-800"
        style={{ height: HEADER_WEEK_H }}
      >
        {weeks.map((w) => (
          <div
            key={w.key}
            className="flex-none flex items-center px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden"
            style={{ width: w.span * config.dayWidth }}
          >
            {w.label}
          </div>
        ))}
      </div>

      {/* Ligne jours */}
      <div className="flex" style={{ height: HEADER_DAY_H }}>
        {Array.from({ length: config.totalDays }, (_, i) => {
          const date = parseDate(addDays(config.startDate, i));
          const dow = date.getDay();
          const isWeekend = dow === 0 || dow === 6;
          return (
            <div
              key={i}
              className={[
                'flex-none flex items-center justify-center text-xs',
                'border-r border-neutral-200 dark:border-neutral-800',
                isWeekend
                  ? 'text-neutral-400 dark:text-neutral-600 bg-neutral-50 dark:bg-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400',
              ].join(' ')}
              style={{ width: config.dayWidth }}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
