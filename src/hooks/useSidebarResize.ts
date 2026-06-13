import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'skein-sidebar-width';
const MIN_W       = 180;
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
  } catch {}
  return DEFAULT_W;
}

export interface SidebarResizeHandle {
  onPointerDown:   React.PointerEventHandler<HTMLDivElement>;
  onPointerMove:   React.PointerEventHandler<HTMLDivElement>;
  onPointerUp:     React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
}

export function useSidebarResize(): {
  width:      number;
  isResizing: boolean;
  handle:     SidebarResizeHandle;
} {
  const [width,      setWidth]      = useState<number>(readWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startX   = useRef(0);
  const startW   = useRef(0);
  const currentW = useRef(width);
  // Sync ref with state so callbacks always see the latest width.
  currentW.current = width;

  // Cursor + selection lock while dragging — avoids text selection and cursor flicker.
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
    // stopPropagation prevents dnd-kit sensors from picking up this pointer event.
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
    setWidth(w);
  }, []);

  const finish = useCallback((): void => {
    setIsResizing(false);
    try { localStorage.setItem(STORAGE_KEY, String(currentW.current)); } catch {}
  }, []);

  const onPointerUp:     React.PointerEventHandler<HTMLDivElement> = useCallback(() => finish(), [finish]);
  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = useCallback(() => finish(), [finish]);

  return {
    width,
    isResizing,
    handle: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
