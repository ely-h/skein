import { addDays, diffInDays } from './dates';

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

export function taskToBar(
  task: { startDate: string; endDate: string },
  config: TimelineConfig,
): { x: number; width: number } {
  const x = dateToPixel(task.startDate, config);
  // endDate est inclusif : une tâche sur 1 jour a une largeur de dayWidth
  const durationDays = Math.max(1, diffInDays(task.startDate, task.endDate) + 1);
  return { x, width: durationDays * config.dayWidth };
}
