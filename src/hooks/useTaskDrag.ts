import { useState, useCallback, useRef } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import type { TimelineConfig } from '../lib/timeline';
import { useTaskStore } from '../store/taskStore';
import { addDays } from '../lib/dates';

type DragType = 'move' | 'resize-left' | 'resize-right';

interface DragState {
  taskId:        string;
  type:          DragType;
  originalStart: string;
  originalEnd:   string;
  // Non-null quand déplacement groupé (move uniquement)
  groupOrigins:  Map<string, { start: string; end: string }> | null;
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
  const [isGroupDragging, setIsGroupDragging] = useState(false);

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
    };
  }, [selectedIds]);

  const onDragMove = useCallback(({ delta }: DragMoveEvent): void => {
    const o = stateRef.current;
    if (!o) return;

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
  }, [config.dayWidth, updateTask]);

  const onDragEnd = useCallback((): void => {
    stateRef.current = null;
    setIsGroupDragging(false);
  }, []);

  return { sensors, onDragStart, onDragMove, onDragEnd, isGroupDragging };
}
