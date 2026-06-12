import { addDays, parseDate } from '../../lib/dates';
import type { TimelineConfig } from '../../lib/timeline';
import { LABEL_W, ROW_H } from './constants';

interface Props {
  config: TimelineConfig;
  rowCount: number;
}

export default function GanttGrid({ config, rowCount }: Props) {
  const totalH = rowCount * ROW_H;

  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{ left: LABEL_W, width: config.totalDays * config.dayWidth, height: totalH }}
    >
      {Array.from({ length: config.totalDays }, (_, i) => {
        const date = parseDate(addDays(config.startDate, i));
        const dow = date.getDay();
        const isWeekend = dow === 0 || dow === 6;
        return (
          <div
            key={i}
            className={[
              'absolute top-0 h-full border-r border-neutral-200 dark:border-neutral-800',
              isWeekend ? 'bg-neutral-50 dark:bg-neutral-900/50' : '',
            ].join(' ')}
            style={{ left: i * config.dayWidth, width: config.dayWidth }}
          />
        );
      })}
    </div>
  );
}
