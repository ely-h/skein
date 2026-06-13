import { addDays, diffInDays, today } from './dates';

export interface TimelineConfig {
  startDate: string; // YYYY-MM-DD, premier jour affiché dans le Gantt
  totalDays: number; // nombre de jours visibles
  dayWidth: number;  // largeur en pixels d'un jour
}

export function dateToPixel(dateStr: string, config: TimelineConfig): number {
  return diffInDays(config.startDate, dateStr) * config.dayWidth;
}

export function pixelToDate(px: number, config: TimelineConfig): string {
  return addDays(config.startDate, Math.floor(px / config.dayWidth));
}

const BOUNDS_PAD_BEFORE = 7;
const BOUNDS_PAD_AFTER  = 14;

export function computeTimelineBounds(
  tasks: ReadonlyArray<{ startDate: string | null; endDate: string | null }>,
  minTotalDays: number,
): { startDate: string; totalDays: number } {
  const dated = tasks.filter(
    (t): t is { startDate: string; endDate: string } =>
      t.startDate !== null && t.endDate !== null,
  );
  if (dated.length === 0) {
    return { startDate: today(), totalDays: minTotalDays };
  }
  const starts     = dated.map((t) => t.startDate).sort();
  const ends       = dated.map((t) => t.endDate).sort();
  const rangeStart = addDays(starts[0], -BOUNDS_PAD_BEFORE);
  const rangeEnd   = addDays(ends[ends.length - 1], BOUNDS_PAD_AFTER);
  const totalDays  = Math.max(diffInDays(rangeStart, rangeEnd) + 1, minTotalDays);
  return { startDate: rangeStart, totalDays };
}

export function taskToBar(
  task: { startDate: string; endDate: string },
  config: TimelineConfig,
): { x: number; width: number } {
  const x = dateToPixel(task.startDate, config);
  // endDate est inclusif : une tâche sur 1 jour a une largeur de dayWidth
  const durationDays = Math.max(1, diffInDays(task.startDate, task.endDate) + 1);
  return { x, width: durationDays * config.dayWidth };
}
