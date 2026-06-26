import { useState, useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import type { TimelineConfig } from '../lib/timeline';
import { addDays } from '../lib/dates';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useHistoryStore } from '../store/historyStore';
import type { Task } from '../types/index';

type DragType = 'move' | 'resize-left' | 'resize-right';

interface DragSession {
  taskId:          string;
  type:            DragType;
  startClientX:    number;
  lastClientX:     number;
  startScrollLeft: number;
  originalStart:   string;
  originalEnd:     string;
  groupOrigins:    Map<string, { start: string; end: string }> | null;
  tasksBefore:     Task[];
}

export interface ActiveDrag {
  taskId:     string;
  type:       DragType;
  daysDelta:  number;
  draggedIds: Set<string>;
}

const SCROLL_ZONE     = 60;
const MAX_SPEED       = 14;
const DRAG_THRESHOLD  = 3;

export function useBarDrag(
  config:      TimelineConfig,
  selectedIds: Set<string>,
  scrollRef:   RefObject<HTMLDivElement | null>,
) {
  const sessionRef     = useRef<DragSession | null>(null);
  const daysDeltaRef   = useRef(0);
  const didDragRef     = useRef(false);
  const draggedIdsRef  = useRef<Set<string>>(new Set());
  // Exposé aux barres pour supprimer le onClick après un drag réel
  const dragJustEndedRef = useRef(false);
  // Capture les handlers actifs pour que pointerup retire exactement ceux ajoutés
  const removeListenersRef = useRef<(() => void) | null>(null);

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

  const handlePointerMove = useCallback((e: PointerEvent): void => {
    const s = sessionRef.current;
    if (!s) return;

    const el         = scrollRef.current;
    const rawDx      = e.clientX - s.startClientX;

    // Activaion visuelle du drag une fois le seuil atteint
    if (!didDragRef.current) {
      if (Math.abs(rawDx) < DRAG_THRESHOLD) return;
      didDragRef.current = true;
      setActiveDrag({
        taskId:     s.taskId,
        type:       s.type,
        daysDelta:  0,
        draggedIds: draggedIdsRef.current,
      });
    }

    // Auto-scroll directionnel (ne scroll que dans le sens du mouvement)
    if (el) {
      const rect      = el.getBoundingClientRect();
      const dir       = e.clientX - s.lastClientX;
      const rightDist = rect.right - e.clientX;
      const leftDist  = e.clientX - rect.left;
      let speed = 0;
      if (dir > 0 && rightDist > 0 && rightDist < SCROLL_ZONE) speed =  MAX_SPEED * (1 - rightDist / SCROLL_ZONE);
      if (dir < 0 && leftDist  > 0 && leftDist  < SCROLL_ZONE) speed = -MAX_SPEED * (1 - leftDist  / SCROLL_ZONE);
      if (speed !== 0) el.scrollLeft += speed;
    }
    s.lastClientX = e.clientX;

    const scrollDelta = (el?.scrollLeft ?? s.startScrollLeft) - s.startScrollLeft;
    const days        = Math.round((rawDx + scrollDelta) / config.dayWidth);

    if (days !== daysDeltaRef.current) {
      daysDeltaRef.current = days;
      setActiveDrag(prev => prev ? { ...prev, daysDelta: days } : null);
    }
  }, [config.dayWidth, scrollRef]);

  const handlePointerUp = useCallback((): void => {
    const s    = sessionRef.current;
    const days = daysDeltaRef.current;

    if (s && didDragRef.current) {
      // Supprime le prochain onClick (il faisait partie du drag)
      dragJustEndedRef.current = true;
      setTimeout(() => { dragJustEndedRef.current = false; }, 0);

      if (days !== 0) {
        const updateTask          = useTaskStore.getState().updateTask;
        const { activeProjectId } = useProjectStore.getState();

        let newStart = s.originalStart;
        let newEnd   = s.originalEnd;

        if (s.type === 'move') {
          newStart = addDays(s.originalStart, days);
          newEnd   = addDays(s.originalEnd,   days);
        } else if (s.type === 'resize-left') {
          newStart = addDays(s.originalStart, days);
          if (newStart >= s.originalEnd) newStart = addDays(s.originalEnd, -1);
        } else {
          newEnd = addDays(s.originalEnd, days);
          if (newEnd <= s.originalStart) newEnd = addDays(s.originalStart, 1);
        }

        updateTask(s.taskId, { startDate: newStart, endDate: newEnd }, { record: false });

        if (s.type === 'move' && s.groupOrigins) {
          s.groupOrigins.forEach(({ start, end }, id) => {
            updateTask(id, {
              startDate: addDays(start, days),
              endDate:   addDays(end,   days),
            }, { record: false });
          });
        }

        if (activeProjectId) {
          useHistoryStore.getState().push(
            activeProjectId,
            s.tasksBefore,
            [...useTaskStore.getState().tasks],
          );
        }
      }
    }

    removeListenersRef.current?.();
    sessionRef.current    = null;
    daysDeltaRef.current  = 0;
    didDragRef.current    = false;
    draggedIdsRef.current = new Set();
    setActiveDrag(null);
  }, []);

  useEffect(() => () => {
    removeListenersRef.current?.();
  }, []);

  const onBarPointerDown = useCallback((
    e:      React.PointerEvent,
    taskId: string,
    type:   DragType,
  ): void => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const tasks = useTaskStore.getState().tasks;
    const task  = tasks.find(t => t.id === taskId);
    if (!task?.startDate || !task?.endDate) return;

    const isGroupMove = type === 'move' && selectedIds.has(taskId) && selectedIds.size > 1;
    let groupOrigins: Map<string, { start: string; end: string }> | null = null;
    const draggedIds = new Set<string>([taskId]);

    if (isGroupMove) {
      groupOrigins = new Map();
      for (const id of selectedIds) {
        if (id === taskId) continue;
        const t = tasks.find(tt => tt.id === id);
        if (t?.startDate && t?.endDate) {
          groupOrigins.set(id, { start: t.startDate, end: t.endDate });
          draggedIds.add(id);
        }
      }
    }

    draggedIdsRef.current = draggedIds;
    sessionRef.current = {
      taskId,
      type,
      startClientX:    e.clientX,
      lastClientX:     e.clientX,
      startScrollLeft: scrollRef.current?.scrollLeft ?? 0,
      originalStart:   task.startDate,
      originalEnd:     task.endDate,
      groupOrigins,
      tasksBefore:     [...tasks],
    };
    daysDeltaRef.current = 0;
    didDragRef.current   = false;

    removeListenersRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup',   handlePointerUp);
      removeListenersRef.current = null;
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup',   handlePointerUp);
  }, [selectedIds, scrollRef, handlePointerMove, handlePointerUp]);

  return { activeDrag, onBarPointerDown, dragJustEndedRef };
}
