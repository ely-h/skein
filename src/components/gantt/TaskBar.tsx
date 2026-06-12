import type { PointerEventHandler } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { taskToBar } from '../../lib/timeline';
import type { TimelineConfig } from '../../lib/timeline';
import type { Task, TaskStatus } from '../../types/index';

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'bg-neutral-300 dark:bg-neutral-600',
  in_progress: 'bg-sky-400 dark:bg-sky-500',
  done:        'bg-emerald-400 dark:bg-emerald-500',
};

/** Poignée de redimensionnement gauche ou droite. */
function ResizeHandle({ id, side }: { id: string; side: 'left' | 'right' }) {
  const { setNodeRef, listeners, attributes } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      // stopPropagation pour éviter d'activer le drag "move" de la barre parente.
      onPointerDown={(e) => {
        e.stopPropagation();
        (listeners?.['onPointerDown'] as PointerEventHandler<HTMLDivElement> | undefined)?.(e);
      }}
      className={[
        'absolute top-0 h-full w-2.5 z-[2] cursor-ew-resize',
        'hover:bg-black/10 dark:hover:bg-white/10',
        side === 'left' ? 'left-0 rounded-l-md' : 'right-0 rounded-r-md',
      ].join(' ')}
    />
  );
}

interface Props {
  task: Task & { startDate: string; endDate: string };
  config: TimelineConfig;
}

export default function TaskBar({ task, config }: Props) {
  const { x, width } = taskToBar(
    { startDate: task.startDate, endDate: task.endDate },
    config,
  );

  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `move-${task.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-no-drag=""
      className={[
        'absolute top-1/2 -translate-y-1/2 h-6 rounded-md touch-none',
        STATUS_COLORS[task.status],
        isDragging ? 'opacity-60 shadow-lg cursor-grabbing' : 'cursor-grab hover:opacity-90',
      ].join(' ')}
      style={{ left: x, width }}
      title={task.name}
    >
      <ResizeHandle id={`resize-left-${task.id}`}  side="left"  />
      <ResizeHandle id={`resize-right-${task.id}`} side="right" />
    </div>
  );
}
