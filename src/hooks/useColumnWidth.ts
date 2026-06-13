import { useState, useCallback } from 'react';
import type { ZoomLevel } from '../types/index';
import { clampDayWidth } from '../lib/timeline';
import { ZOOM_CONFIGS } from '../components/gantt/constants';

const STORAGE_KEY = 'skein-column-widths';

function loadWidths(): Record<ZoomLevel, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWidths();
    const parsed = JSON.parse(raw) as Partial<Record<ZoomLevel, number>>;
    return {
      day:   clampDayWidth('day',   parsed.day   ?? ZOOM_CONFIGS.day.dayWidth),
      week:  clampDayWidth('week',  parsed.week  ?? ZOOM_CONFIGS.week.dayWidth),
      month: clampDayWidth('month', parsed.month ?? ZOOM_CONFIGS.month.dayWidth),
    };
  } catch {
    return defaultWidths();
  }
}

function defaultWidths(): Record<ZoomLevel, number> {
  return {
    day:   ZOOM_CONFIGS.day.dayWidth,
    week:  ZOOM_CONFIGS.week.dayWidth,
    month: ZOOM_CONFIGS.month.dayWidth,
  };
}

function saveWidths(widths: Record<ZoomLevel, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  } catch {
    // ignore quota errors
  }
}

export function useColumnWidth(): {
  widths:   Record<ZoomLevel, number>;
  setWidth: (zoom: ZoomLevel, w: number) => void;
} {
  const [widths, setWidths] = useState<Record<ZoomLevel, number>>(loadWidths);

  const setWidth = useCallback((zoom: ZoomLevel, w: number): void => {
    const clamped = clampDayWidth(zoom, w);
    setWidths((prev) => {
      const next = { ...prev, [zoom]: clamped };
      saveWidths(next);
      return next;
    });
  }, []);

  return { widths, setWidth };
}
