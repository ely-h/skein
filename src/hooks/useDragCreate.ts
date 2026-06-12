import { useState, useCallback, useRef, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react';
import type { TimelineConfig } from '../lib/timeline';
import { addDays } from '../lib/dates';

export interface DragPreview {
  /** Offset en pixels depuis le début de la timeline (LABEL_W exclu). */
  x: number;
  width: number;
  startDate: string;
  endDate: string;
}

export interface DragResult {
  startDate: string;
  endDate: string;
}

export function useDragCreate(
  config: TimelineConfig,
  containerRef: RefObject<HTMLDivElement | null>,
  labelWidth: number,
): {
  preview: DragPreview | null;
  onMouseDown: (e: ReactMouseEvent) => void;
  result: DragResult | null;
  clearResult: () => void;
} {
  const [preview, setPreview] = useState<DragPreview | null>(null);
  const [result,  setResult]  = useState<DragResult | null>(null);
  // Stocke le cleanup des listeners globaux pour le démontage.
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => { cleanupRef.current?.(); }, []);

  const onMouseDown = useCallback((e: ReactMouseEvent): void => {
    if (e.button !== 0) return;
    // Ne pas démarrer le drag sur les boutons ou zones marquées data-no-drag.
    if ((e.target as HTMLElement).closest('button, [data-no-drag]')) return;
    e.preventDefault();

    const el = containerRef.current;
    if (!el) return;

    function pxToDay(clientX: number): number {
      const rect = el!.getBoundingClientRect();
      const relX  = clientX - rect.left + el!.scrollLeft - labelWidth;
      return Math.max(0, Math.min(Math.floor(relX / config.dayWidth), config.totalDays - 1));
    }

    function buildPreview(startDay: number, currentDay: number): DragPreview {
      const lo = Math.min(startDay, currentDay);
      const hi = Math.max(startDay, currentDay);
      return {
        x:         lo * config.dayWidth,
        width:     (hi - lo + 1) * config.dayWidth,
        startDate: addDays(config.startDate, lo),
        endDate:   addDays(config.startDate, hi),
      };
    }

    const startDay = pxToDay(e.clientX);
    setPreview(buildPreview(startDay, startDay));

    function onMove(ev: MouseEvent): void {
      setPreview(buildPreview(startDay, pxToDay(ev.clientX)));
    }

    function cleanup(): void {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      cleanupRef.current = null;
    }

    function onUp(ev: MouseEvent): void {
      const lo = Math.min(startDay, pxToDay(ev.clientX));
      const hi = Math.max(startDay, pxToDay(ev.clientX));
      setResult({
        startDate: addDays(config.startDate, lo),
        endDate:   addDays(config.startDate, hi),
      });
      setPreview(null);
      cleanup();
    }

    cleanupRef.current = cleanup;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [config, containerRef, labelWidth]);

  const clearResult = useCallback((): void => setResult(null), []);

  return { preview, onMouseDown, result, clearResult };
}
