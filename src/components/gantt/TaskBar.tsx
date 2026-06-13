import type { PointerEventHandler } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { taskToBar } from '../../lib/timeline';
import type { TimelineConfig } from '../../lib/timeline';
import type { Task, TaskStatus } from '../../types/index';

const STATUS_BG: Record<TaskStatus, string> = {
  not_started: 'bg-neutral-300 dark:bg-neutral-500',
  in_progress: 'bg-sky-400 dark:bg-sky-500',
  done:        'bg-emerald-400 dark:bg-emerald-500',
};

// Couleur du texte dans la barre selon le statut
const STATUS_TEXT: Record<TaskStatus, string> = {
  not_started: 'text-neutral-600 dark:text-neutral-200',
  in_progress: 'text-white',
  done:        'text-white',
};

function ResizeHandle({ id, side }: { id: string; side: 'left' | 'right' }) {
  const { setNodeRef, listeners, attributes } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        e.stopPropagation();
        (listeners?.['onPointerDown'] as PointerEventHandler<HTMLDivElement> | undefined)?.(e);
      }}
      className={[
        'absolute top-0 h-full w-2.5 z-[2] cursor-ew-resize transition-colors',
        'hover:bg-black/10 dark:hover:bg-white/15',
        side === 'left' ? 'left-0 rounded-l-md' : 'right-0 rounded-r-md',
      ].join(' ')}
    />
  );
}

interface Props {
  task: Task & { startDate: string; endDate: string };
  config: TimelineConfig;
}

const MIN_WIDTH_FOR_LABEL = 48;

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
        'absolute top-1/2 -translate-y-1/2 h-7 rounded-md touch-none overflow-hidden transition-opacity',
        STATUS_BG[task.status],
        isDragging
          ? 'opacity-50 shadow-lg cursor-grabbing'
          : 'cursor-grab hover:opacity-85',
      ].join(' ')}
      style={{ left: x, width }}
      title={task.name}
    >
      <ResizeHandle id={`resize-left-${task.id}`}  side="left"  />
      <ResizeHandle id={`resize-right-${task.id}`} side="right" />

      {/* Nom de la tâche — visible si la barre est assez large */}
      {width >= MIN_WIDTH_FOR_LABEL && (
        <span
          className={[
            'absolute inset-x-3 inset-y-0 flex items-center text-[11px] font-medium',
            'truncate pointer-events-none select-none',
            STATUS_TEXT[task.status],
          ].join(' ')}
        >
          {task.name}
        </span>
      )}
    </div>
  );
}
