import { useState, useCallback, useRef } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import type { TimelineConfig } from '../lib/timeline';
import { useTaskStore } from '../store/taskStore';
import { addDays } from '../lib/dates';
import { ROW_H } from '../components/gantt/constants';

// Mouvement minimal avant de décider l'axe (horizontal vs vertical)
const AXIS_THRESHOLD = 8;

type DragType = 'move' | 'resize-left' | 'resize-right';
type DragAxis = 'undecided' | 'horizontal' | 'vertical';

interface DragState {
  taskId:        string;
  type:          DragType;
  originalStart: string;
  originalEnd:   string;
  groupOrigins:  Map<string, { start: string; end: string }> | null;
  axis:          DragAxis;
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

export function useTaskDrag(config: TimelineConfig, selectedIds: Set<string>) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const stateRef   = useRef<DragState | null>(null);

  const [isGroupDragging,    setIsGroupDragging]    = useState(false);
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);
  const [verticalTargetIndex, setVerticalTargetIndex] = useState<number | null>(null);

  // Ref synchrone pour lire le dernier index cible dans onDragEnd sans stale closure
  const verticalTargetIndexRef = useRef<number | null>(null);
  // Résultat du tri vertical à consommer par GanttChart.handleDragEnd
  const pendingReorderRef = useRef<VerticalReorder | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );

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

    stateRef.current = {
      taskId:        parsed.taskId,
      type:          parsed.type,
      originalStart: task.startDate,
      originalEnd:   task.endDate,
      groupOrigins,
      // Les handles de resize sont toujours horizontaux
      axis:          parsed.type === 'move' ? 'undecided' : 'horizontal',
    };
  }, [selectedIds]);

  const onDragMove = useCallback(({ delta }: DragMoveEvent): void => {
    const o = stateRef.current;
    if (!o) return;

    // Détection d'axe — seuil 8px, priorité au vertical si absY > absX
    if (o.axis === 'undecided') {
      const absX = Math.abs(delta.x);
      const absY = Math.abs(delta.y);
      if (absY >= AXIS_THRESHOLD && absY > absX) {
        o.axis = 'vertical';
        setIsVerticalDragging(true);
      } else if (absX >= AXIS_THRESHOLD) {
        o.axis = 'horizontal';
      } else {
        return; // pas encore assez de mouvement pour décider
      }
    }

    if (o.axis === 'horizontal') {
      const days = Math.round(delta.x / config.dayWidth);
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

      updateTask(o.taskId, { startDate: start, endDate: end });

      if (o.type === 'move' && o.groupOrigins) {
        o.groupOrigins.forEach(({ start: gs, end: ge }, id) => {
          updateTask(id, { startDate: addDays(gs, days), endDate: addDays(ge, days) });
        });
      }

    } else if (o.axis === 'vertical') {
      const tasks       = useTaskStore.getState().tasks;
      const sorted      = [...tasks].sort((a, b) => a.order - b.order);
      const currentIdx  = sorted.findIndex((t) => t.id === o.taskId);
      if (currentIdx === -1) return;

      const shift     = Math.round(delta.y / ROW_H);
      const targetIdx = Math.max(0, Math.min(sorted.length - 1, currentIdx + shift));

      verticalTargetIndexRef.current = targetIdx;
      setVerticalTargetIndex(targetIdx);
    }
  }, [config.dayWidth, updateTask]);

  const onDragEnd = useCallback((): void => {
    const o         = stateRef.current;
    const targetIdx = verticalTargetIndexRef.current;

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
  }, []);

  /** À appeler dans handleDragEnd (GanttChart) juste après taskDragEnd(). */
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
