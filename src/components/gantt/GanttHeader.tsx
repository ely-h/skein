import { useRef } from 'react';
import { format, getISOWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { addDays, parseDate } from '../../lib/dates';
import type { TimelineConfig } from '../../lib/timeline';
import type { ZoomLevel } from '../../types/index';
import { HEADER_DAY_H, HEADER_WEEK_H } from './constants';

interface Cell {
  label: string;
  widthPx: number;
  key: number;
  spanDays: number;
  isWeekend?: boolean;
}

function ResizeGrip({
  spanDays,
  currentDayWidth,
  onDayWidthChange,
}: {
  spanDays: number;
  currentDayWidth: number;
  onDayWidthChange: (w: number) => void;
}) {
  const stateRef = useRef<{ startX: number; startDayWidth: number } | null>(null);

  return (
    <div
      className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize z-10 hover:bg-emerald-400/40 active:bg-emerald-500/50"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        stateRef.current = { startX: e.clientX, startDayWidth: currentDayWidth };
      }}
      onPointerMove={(e) => {
        if (!stateRef.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const delta = e.clientX - stateRef.current.startX;
        onDayWidthChange(stateRef.current.startDayWidth + delta / spanDays);
      }}
      onPointerUp={(e) => {
        stateRef.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }}
      onPointerCancel={(e) => {
        stateRef.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }}
    />
  );
}

// ─── Vue Jour ────────────────────────────────────────────────────────────────

function dayRow1(config: TimelineConfig): Cell[] {
  const cells: Cell[] = [];
  let i = 0;
  while (i < config.totalDays) {
    const date       = parseDate(addDays(config.startDate, i));
    const dow        = date.getDay();
    const isoDay     = dow === 0 ? 7 : dow;
    const span       = Math.min(isoDay === 1 ? 7 : 8 - isoDay, config.totalDays - i);
    cells.push({ label: format(date, 'd MMM', { locale: fr }), widthPx: span * config.dayWidth, spanDays: span, key: i });
    i += span;
  }
  return cells;
}

function dayRow2(config: TimelineConfig): Cell[] {
  return Array.from({ length: config.totalDays }, (_, i) => {
    const date = parseDate(addDays(config.startDate, i));
    const dow  = date.getDay();
    return {
      label:     String(date.getDate()),
      widthPx:   config.dayWidth,
      spanDays:  1,
      key:       i,
      isWeekend: dow === 0 || dow === 6,
    };
  });
}

// ─── Vue Semaine ─────────────────────────────────────────────────────────────

function weekRow2(config: TimelineConfig): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < config.totalDays; i += 7) {
    const date = parseDate(addDays(config.startDate, i));
    const span = Math.min(7, config.totalDays - i);
    cells.push({ label: `S${getISOWeek(date)}`, widthPx: span * config.dayWidth, spanDays: span, key: i });
  }
  return cells;
}

function weekRow1(config: TimelineConfig): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < config.totalDays; i += 7) {
    const date      = parseDate(addDays(config.startDate, i));
    const span      = Math.min(7, config.totalDays - i);
    const label     = format(date, 'MMM yyyy', { locale: fr });
    const last      = cells[cells.length - 1];
    if (last && last.label === label) {
      last.widthPx  += span * config.dayWidth;
      last.spanDays += span;
    } else {
      cells.push({ label, widthPx: span * config.dayWidth, spanDays: span, key: i });
    }
  }
  return cells;
}

// ─── Vue Mois ─────────────────────────────────────────────────────────────────

function monthRow2(config: TimelineConfig): Cell[] {
  const cells: Cell[] = [];
  let i = 0;
  while (i < config.totalDays) {
    const date  = parseDate(addDays(config.startDate, i));
    const y     = date.getFullYear();
    const m     = date.getMonth();
    let span    = 0;
    while (i + span < config.totalDays) {
      const d = parseDate(addDays(config.startDate, i + span));
      if (d.getFullYear() !== y || d.getMonth() !== m) break;
      span++;
    }
    cells.push({ label: format(date, 'MMM', { locale: fr }), widthPx: span * config.dayWidth, spanDays: span, key: i });
    i += span;
  }
  return cells;
}

function monthRow1(config: TimelineConfig): Cell[] {
  const months = monthRow2(config);
  const cells: Cell[] = [];
  for (const m of months) {
    const date  = parseDate(addDays(config.startDate, m.key));
    const label = String(date.getFullYear());
    const last  = cells[cells.length - 1];
    if (last && last.label === label) {
      last.widthPx  += m.widthPx;
      last.spanDays += m.spanDays;
    } else {
      cells.push({ label, widthPx: m.widthPx, spanDays: m.spanDays, key: m.key });
    }
  }
  return cells;
}

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  config:            TimelineConfig;
  zoom:              ZoomLevel;
  onDayWidthChange?: (w: number) => void;
}

export default function GanttHeader({ config, zoom, onDayWidthChange }: Props) {
  const row1 = zoom === 'day'   ? dayRow1(config)
             : zoom === 'week'  ? weekRow1(config)
             : monthRow1(config);

  const row2 = zoom === 'day'   ? dayRow2(config)
             : zoom === 'week'  ? weekRow2(config)
             : monthRow2(config);

  return (
    <div className="flex-none select-none" style={{ width: config.totalDays * config.dayWidth }}>

      {/* Ligne supérieure : semaines / mois / années */}
      <div
        className="flex border-b border-neutral-200 dark:border-neutral-700"
        style={{ height: HEADER_WEEK_H }}
      >
        {row1.map((cell) => (
          <div
            key={cell.key}
            className="flex-none flex items-center px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-700 overflow-hidden"
            style={{ width: cell.widthPx }}
          >
            {cell.label}
          </div>
        ))}
      </div>

      {/* Ligne inférieure : jours / numéros de semaine / mois */}
      <div className="flex" style={{ height: HEADER_DAY_H }}>
        {row2.map((cell) => (
          <div
            key={cell.key}
            className={[
              'relative flex-none flex items-center justify-center text-xs overflow-hidden',
              'border-r border-neutral-200 dark:border-neutral-700',
              cell.isWeekend
                ? 'text-neutral-400 dark:text-neutral-600 bg-neutral-50 dark:bg-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400',
            ].join(' ')}
            style={{ width: cell.widthPx }}
          >
            {cell.label}
            {onDayWidthChange && (
              <ResizeGrip
                spanDays={cell.spanDays}
                currentDayWidth={config.dayWidth}
                onDayWidthChange={onDayWidthChange}
              />
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
