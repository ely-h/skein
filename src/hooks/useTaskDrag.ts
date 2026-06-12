import { useCallback, useRef } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import type { TimelineConfig } from '../lib/timeline';
import { useTaskStore } from '../store/taskStore';
import { addDays } from '../lib/dates';

type DragType = 'move' | 'resize-left' | 'resize-right';

interface DragOrigin {
  taskId: string;
  type: DragType;
  originalStart: string;
  originalEnd: string;
}

function parseDragId(id: string): { taskId: string; type: DragType } | null {
  if (id.startsWith('resize-left-'))  return { taskId: id.slice(12), type: 'resize-left'  };
  if (id.startsWith('resize-right-')) return { taskId: id.slice(13), type: 'resize-right' };
  if (id.startsWith('move-'))         return { taskId: id.slice(5),  type: 'move'          };
  return null;
}

export function useTaskDrag(config: TimelineConfig) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const originRef  = useRef<DragOrigin | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );

  const onDragStart = useCallback(({ active }: DragStartEvent): void => {
    const parsed = parseDragId(String(active.id));
    if (!parsed) return;
    const task = useTaskStore.getState().tasks.find((t) => t.id === parsed.taskId);
    if (!task?.startDate || !task?.endDate) return;
    originRef.current = { ...parsed, originalStart: task.startDate, originalEnd: task.endDate };
  }, []);

  const onDragMove = useCallback(({ delta }: DragMoveEvent): void => {
    const o = originRef.current;
    if (!o) return;

    const days = Math.round(delta.x / config.dayWidth);
    let start = o.originalStart;
    let end   = o.originalEnd;

    if (o.type === 'move') {
      start = addDays(o.originalStart, days);
      end   = addDays(o.originalEnd,   days);
    } else if (o.type === 'resize-left') {
      start = addDays(o.originalStart, days);
      if (start > o.originalEnd) start = o.originalEnd; // durée min 1 jour
    } else {
      end = addDays(o.originalEnd, days);
      if (end < o.originalStart) end = o.originalStart; // durée min 1 jour
    }

    updateTask(o.taskId, { startDate: start, endDate: end });
  }, [config.dayWidth, updateTask]);

  const onDragEnd = useCallback((): void => {
    originRef.current = null;
  }, []);

  return { sensors, onDragStart, onDragMove, onDragEnd };
}
