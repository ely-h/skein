import { useState, useCallback, useRef } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import type { RefObject } from 'react';
import type { TimelineConfig } from '../lib/timeline';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useHistoryStore } from '../store/historyStore';
import { addDays } from '../lib/dates';
import { ROW_H } from '../components/gantt/constants';
import type { Task } from '../types/index';

const AXIS_THRESHOLD = 8;
const SCROLL_ZONE    = 60;  // px depuis le bord gauche/droit pour déclencher l'auto-scroll
const MAX_SPEED      = 12;  // px par frame (~720 px/s à 60 fps)

type DragType = 'move' | 'resize-left' | 'resize-right';
type DragAxis = 'undecided' | 'horizontal' | 'vertical';

interface DragState {
  taskId:        string;
  type:          DragType;
  originalStart: string;
  originalEnd:   string;
  groupOrigins:  Map<string, { start: string; end: string }> | null;
  axis:          DragAxis;
  tasksBefore:   Task[];
  hasChanged:    boolean;
}

interface VerticalReorder {
  taskId:      string;
  targetIndex: number;
}

function parseDragId(id: string): { taskId: string; type: DragType } | null {
  if (id.startsWith('resize-left-'))  return { taskId: id.slice(12), type: 'resize-left'  };
  if (id.startsWith('resize-right-')) return { taskId: id.slice(13), type: 'resize-right' };
  if (id.startsWith('move-'))         return { taskId: id.slice(5),  type: 'move'          };
  return null;
}

export function useTaskDrag(
  config: TimelineConfig,
  selectedIds: Set<string>,
  scrollRef: RefObject<HTMLDivElement | null>,
) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const stateRef   = useRef<DragState | null>(null);

  const [isGroupDragging,     setIsGroupDragging]     = useState(false);
  const [isVerticalDragging,  setIsVerticalDragging]  = useState(false);
  const [verticalTargetIndex, setVerticalTargetIndex] = useState<number | null>(null);

  const verticalTargetIndexRef = useRef<number | null>(null);
  const pendingReorderRef      = useRef<VerticalReorder | null>(null);
  const pointerMoveCleanupRef  = useRef<(() => void) | null>(null);

  // Refs pour l'auto-scroll (pas de re-render, lecture synchrone dans le RAF)
  const rafRef           = useRef<number | null>(null);
  const initialScrollRef = useRef<number>(0);
  const scrollDeltaRef   = useRef<number>(0);
  const pointerXRef      = useRef<number>(0);
  const latestDeltaRef   = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );

  // Applique le déplacement horizontal en corrigeant le scroll intervenu pendant le drag.
  const applyHorizontalMove = useCallback((
    delta: { x: number },
    scrollDelta: number,
  ): void => {
    const o = stateRef.current;
    if (!o) return;

    const days = Math.round((delta.x + scrollDelta) / config.dayWidth);
    let start  = o.originalStart;
    let end    = o.originalEnd;

    if (o.type === 'move') {
      start = addDays(o.originalStart, days);
      end   = addDays(o.originalEnd,   days);
    } else if (o.type === 'resize-left') {
      start = addDays(o.originalStart, days);
      if (start > o.originalEnd) start = o.originalEnd;
    } else {
      end = addDays(o.originalEnd, days);
      if (end < o.originalStart) end = o.originalStart;
    }

    updateTask(o.taskId, { startDate: start, endDate: end }, { record: false });
    o.hasChanged = true;

    if (o.type === 'move' && o.groupOrigins) {
      o.groupOrigins.forEach(({ start: gs, end: ge }, id) => {
        updateTask(id, { startDate: addDays(gs, days), endDate: addDays(ge, days) }, { record: false });
      });
    }
  }, [config.dayWidth, updateTask]);

  const stopAutoScroll = useCallback((): void => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback((): void => {
    if (rafRef.current !== null) return; // déjà actif

    function tick(): void {
      const container = scrollRef.current;
      if (!container || !stateRef.current) {
        rafRef.current = null;
        return;
      }

      const rect   = container.getBoundingClientRect();
      const relX   = pointerXRef.current - rect.left;
      const innerW = rect.width;

      // relX < 0 = souris dans la sidebar (hors conteneur) : pas de scroll
      let speed = 0;
      if (relX >= 0 && relX < SCROLL_ZONE) {
        speed = -MAX_SPEED * (1 - relX / SCROLL_ZONE);
      } else if (relX > innerW - SCROLL_ZONE && relX <= innerW) {
        const fromRight = innerW - relX;
        speed = MAX_SPEED * (1 - fromRight / SCROLL_ZONE);
      }

      if (speed !== 0) {
        container.scrollLeft  += speed;
        scrollDeltaRef.current = container.scrollLeft - initialScrollRef.current;
        // Met à jour la barre sans attendre le prochain pointermove
        applyHorizontalMove(latestDeltaRef.current, scrollDeltaRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [scrollRef, applyHorizontalMove]);

  const onDragStart = useCallback(({ active }: DragStartEvent): void => {
    const parsed = parseDragId(String(active.id));
    if (!parsed) return;
    const tasks = useTaskStore.getState().tasks;
    const task  = tasks.find((t) => t.id === parsed.taskId);
    if (!task?.startDate || !task?.endDate) return;

    const isGroupMove =
      parsed.type === 'move' &&
      selectedIds.has(parsed.taskId) &&
      selectedIds.size > 1;

    let groupOrigins: Map<string, { start: string; end: string }> | null = null;
    if (isGroupMove) {
      groupOrigins = new Map();
      for (const id of selectedIds) {
        if (id === parsed.taskId) continue;
        const t = tasks.find((tt) => tt.id === id);
        if (t?.startDate && t?.endDate) {
          groupOrigins.set(id, { start: t.startDate, end: t.endDate });
        }
      }
      setIsGroupDragging(true);
    }

    initialScrollRef.current = scrollRef.current?.scrollLeft ?? 0;
    scrollDeltaRef.current   = 0;
    latestDeltaRef.current   = { x: 0, y: 0 };

    // Pointermove natif pour connaître la position X brute (non fournie par dnd-kit)
    function onPointerMove(e: PointerEvent): void {
      pointerXRef.current = e.clientX;
    }
    window.addEventListener('pointermove', onPointerMove);
    pointerMoveCleanupRef.current = () => window.removeEventListener('pointermove', onPointerMove);

    stateRef.current = {
      taskId:        parsed.taskId,
      type:          parsed.type,
      originalStart: task.startDate,
      originalEnd:   task.endDate,
      groupOrigins,
      axis:          parsed.type === 'move' ? 'undecided' : 'horizontal',
      tasksBefore:   [...tasks],
      hasChanged:    false,
    };
  }, [selectedIds, scrollRef]);

  const onDragMove = useCallback(({ delta }: DragMoveEvent): void => {
    const o = stateRef.current;
    if (!o) return;

    latestDeltaRef.current = delta;

    if (o.axis === 'undecided') {
      const absX = Math.abs(delta.x);
      const absY = Math.abs(delta.y);
      if (absY >= AXIS_THRESHOLD && absY > absX) {
        o.axis = 'vertical';
        setIsVerticalDragging(true);
        stopAutoScroll();
        return;
      } else if (absX >= AXIS_THRESHOLD) {
        o.axis = 'horizontal';
      } else {
        return;
      }
    }

    if (o.axis === 'horizontal') {
      applyHorizontalMove(delta, scrollDeltaRef.current);
      startAutoScroll();

    } else if (o.axis === 'vertical') {
      const tasks      = useTaskStore.getState().tasks;
      const sorted     = [...tasks].sort((a, b) => a.order - b.order);
      const currentIdx = sorted.findIndex((t) => t.id === o.taskId);
      if (currentIdx === -1) return;

      const shift     = Math.round(delta.y / ROW_H);
      const targetIdx = Math.max(0, Math.min(sorted.length - 1, currentIdx + shift));

      verticalTargetIndexRef.current = targetIdx;
      setVerticalTargetIndex(targetIdx);
    }
  }, [applyHorizontalMove, startAutoScroll, stopAutoScroll]);

  const onDragEnd = useCallback((): void => {
    stopAutoScroll();
    pointerMoveCleanupRef.current?.();
    pointerMoveCleanupRef.current = null;

    const o         = stateRef.current;
    const targetIdx = verticalTargetIndexRef.current;
    const { activeProjectId } = useProjectStore.getState();

    if (o?.axis === 'horizontal' && o.hasChanged && activeProjectId) {
      const tasksAfter = [...useTaskStore.getState().tasks];
      useHistoryStore.getState().push(activeProjectId, o.tasksBefore, tasksAfter);
    }

    if (o?.axis === 'vertical' && targetIdx !== null) {
      const tasks      = useTaskStore.getState().tasks;
      const sorted     = [...tasks].sort((a, b) => a.order - b.order);
      const currentIdx = sorted.findIndex((t) => t.id === o.taskId);
      if (currentIdx !== -1 && currentIdx !== targetIdx) {
        pendingReorderRef.current = { taskId: o.taskId, targetIndex: targetIdx };
      }
    }

    stateRef.current               = null;
    verticalTargetIndexRef.current = null;
    setIsGroupDragging(false);
    setIsVerticalDragging(false);
    setVerticalTargetIndex(null);
  }, [stopAutoScroll]);

  const popVerticalReorder = useCallback((): VerticalReorder | null => {
    const r = pendingReorderRef.current;
    pendingReorderRef.current = null;
    return r;
  }, []);

  return {
    sensors,
    onDragStart,
    onDragMove,
    onDragEnd,
    isGroupDragging,
    isVerticalDragging,
    verticalTargetIndex,
    popVerticalReorder,
  };
}
