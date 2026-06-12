import type { ZoomLevel } from '../../types/index';

export const LABEL_W = 220;
export const DAY_W = 40;
export const ROW_H = 40;
export const TOTAL_DAYS = 56; // 8 semaines (vue jour par défaut)
export const HEADER_WEEK_H = 28;
export const HEADER_DAY_H = 28;

export const ZOOM_CONFIGS: Record<ZoomLevel, { dayWidth: number; totalDays: number }> = {
  day:   { dayWidth: 40, totalDays: 56  }, // 8 semaines
  week:  { dayWidth: 12, totalDays: 112 }, // 16 semaines
  month: { dayWidth: 4,  totalDays: 365 }, // 12 mois
};
