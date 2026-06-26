import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'skein-label-width';
const MIN_W       = 150;
const MAX_W       = 400;
const DEFAULT_W   = 220;

function clamp(v: number): number {
  return Math.min(MAX_W, Math.max(MIN_W, v));
}

function readWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const n = Number(raw);
      if (Number.isFinite(n)) return clamp(n);
    }
  } catch { /* empty */ }
  return DEFAULT_W;
}

export interface LabelResizeHandle {
  onPointerDown:   React.PointerEventHandler<HTMLDivElement>;
  onPointerMove:   React.PointerEventHandler<HTMLDivElement>;
  onPointerUp:     React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
}

export function useLabelResize(): {
  labelW:     number;
  isResizing: boolean;
  handle:     LabelResizeHandle;
} {
  const [labelW,     setLabelW]     = useState<number>(readWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startX   = useRef(0);
  const startW   = useRef(0);
  const currentW = useRef(labelW);
  useEffect(() => { currentW.current = labelW; }, [labelW]);

  useEffect(() => {
    if (!isResizing) return;
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor     = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [isResizing]);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startW.current = currentW.current;
    setIsResizing(true);
  }, []);

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = useCallback((e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const w = clamp(startW.current + (e.clientX - startX.current));
    currentW.current = w;
    setLabelW(w);
  }, []);

  const finish = useCallback((): void => {
    setIsResizing(false);
    try { localStorage.setItem(STORAGE_KEY, String(currentW.current)); } catch { /* empty */ }
  }, []);

  const onPointerUp:     React.PointerEventHandler<HTMLDivElement> = useCallback(() => finish(), [finish]);
  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = useCallback(() => finish(), [finish]);

  return {
    labelW,
    isResizing,
    handle: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
