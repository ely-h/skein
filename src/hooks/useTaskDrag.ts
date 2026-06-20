import { useState, useCallback, useRef } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import { ROW_H } from '../components/gantt/constants';
import { useTaskStore } from '../store/taskStore';

interface VerticalReorder {
  taskId:      string;
  targetIndex: number;
}

// Gère uniquement le réordonnage vertical via le grip handle (dnd-kit).
// Le drag horizontal des barres est dans useBarDrag.
export function useTaskDrag() {
  const [isVerticalDragging,  setIsVerticalDragging]  = useState(false);
  const [verticalTargetIndex, setVerticalTargetIndex] = useState<number | null>(null);

  const activeTaskIdRef        = useRef<string | null>(null);
  const verticalTargetIndexRef = useRef<number | null>(null);
  const pendingReorderRef      = useRef<VerticalReorder | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );

  const onDragStart = useCallback(({ active }: DragStartEvent): void => {
    activeTaskIdRef.current = String(active.id);
    setIsVerticalDragging(true);
  }, []);

  const onDragMove = useCallback(({ delta }: DragMoveEvent): void => {
    const taskId = activeTaskIdRef.current;
    if (!taskId) return;
    const tasks   = useTaskStore.getState().tasks;
    const sorted  = [...tasks].sort((a, b) => a.order - b.order);
    const currIdx = sorted.findIndex((t) => t.id === taskId);
    if (currIdx === -1) return;
    const targetIdx = Math.max(0, Math.min(sorted.length - 1, currIdx + Math.round(delta.y / ROW_H)));
    verticalTargetIndexRef.current = targetIdx;
    setVerticalTargetIndex(targetIdx);
  }, []);

  const onDragEnd = useCallback((): void => {
    const taskId    = activeTaskIdRef.current;
    const targetIdx = verticalTargetIndexRef.current;
    if (taskId !== null && targetIdx !== null) {
      const tasks   = useTaskStore.getState().tasks;
      const sorted  = [...tasks].sort((a, b) => a.order - b.order);
      const currIdx = sorted.findIndex((t) => t.id === taskId);
      if (currIdx !== -1 && currIdx !== targetIdx) {
        pendingReorderRef.current = { taskId, targetIndex: targetIdx };
      }
    }
    activeTaskIdRef.current        = null;
    verticalTargetIndexRef.current = null;
    setIsVerticalDragging(false);
    setVerticalTargetIndex(null);
  }, []);

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
    isVerticalDragging,
    verticalTargetIndex,
    popVerticalReorder,
  };
}
