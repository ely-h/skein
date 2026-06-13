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

/**
 * Comme computeTimelineBounds, mais tient compte des overrides manuels du projet.
 * La plage manuelle est toujours étendue pour inclure toutes les tâches existantes.
 */
export function resolveTimelineBounds(
  tasks: ReadonlyArray<{ startDate: string | null; endDate: string | null }>,
  timelineStart: string | null,
  timelineEnd:   string | null,
  minTotalDays:  number,
): { startDate: string; endDate: string; totalDays: number } {
  const auto = computeTimelineBounds(tasks, minTotalDays);
  const autoEnd = addDays(auto.startDate, auto.totalDays - 1);

  if (timelineStart === null && timelineEnd === null) {
    return { ...auto, endDate: autoEnd };
  }

  let start = timelineStart ?? auto.startDate;
  let end   = timelineEnd   ?? autoEnd;

  // Clamp : la plage ne peut pas exclure une tâche existante
  const dated = tasks.filter(
    (t): t is { startDate: string; endDate: string } =>
      t.startDate !== null && t.endDate !== null,
  );
  if (dated.length > 0) {
    const taskStart = [...dated.map((t) => t.startDate)].sort()[0];
    const taskEnd   = [...dated.map((t) => t.endDate)].sort().at(-1)!;
    if (start > taskStart) start = taskStart;
    if (end   < taskEnd)   end   = taskEnd;
  }

  const totalDays = Math.max(diffInDays(start, end) + 1, minTotalDays);
  return { startDate: start, endDate: end, totalDays };
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
