import { addDays } from '../../lib/dates';
import { taskToBar } from '../../lib/timeline';
import type { TimelineConfig } from '../../lib/timeline';
import type { Task } from '../../types/index';
import { useThemeStore } from '../../store/themeStore';
import type { ActiveDrag } from '../../hooks/useBarDrag';

type DragType = 'move' | 'resize-left' | 'resize-right';

interface ResizeHandleProps {
  taskId:        string;
  side:          'left' | 'right';
  onPointerDown: (e: React.PointerEvent, taskId: string, type: DragType) => void;
}

function ResizeHandle({ taskId, side, onPointerDown }: ResizeHandleProps) {
  return (
    <div
      className={[
        'absolute top-0 h-full w-2.5 z-[2] cursor-ew-resize transition-colors',
        'hover:bg-black/10 dark:hover:bg-white/15',
        side === 'left' ? 'left-0 rounded-l-md' : 'right-0 rounded-r-md',
      ].join(' ')}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e, taskId, `resize-${side}` as DragType);
      }}
    />
  );
}

interface Props {
  task:             Task & { startDate: string; endDate: string };
  config:           TimelineConfig;
  isSelected:       boolean;
  activeDrag:       ActiveDrag | null;
  dragJustEndedRef: React.RefObject<boolean>;
  onPointerDown:    (e: React.PointerEvent, taskId: string, type: DragType) => void;
  onSelect:         (id: string, additive: boolean) => void;
}

export default function TaskBar({
  task, config, isSelected, activeDrag, dragJustEndedRef, onPointerDown, onSelect,
}: Props) {
  const statusColors = useThemeStore((s) => s.statusColors);
  const bgColor = task.status === 'custom' && task.customStatus
    ? task.customStatus.color
    : statusColors[task.status];

  const isDragging = activeDrag?.draggedIds.has(task.id) ?? false;
  const daysDelta  = isDragging ? (activeDrag?.daysDelta ?? 0) : 0;
  const dragType   = isDragging ? (activeDrag?.type ?? 'move')  : 'move';

  // Calcule la position d'affichage ghost sans toucher au store
  let displayStart = task.startDate;
  let displayEnd   = task.endDate;

  if (isDragging && daysDelta !== 0) {
    if (dragType === 'move') {
      displayStart = addDays(task.startDate, daysDelta);
      displayEnd   = addDays(task.endDate,   daysDelta);
    } else if (dragType === 'resize-left') {
      displayStart = addDays(task.startDate, daysDelta);
      if (displayStart >= task.endDate) displayStart = addDays(task.endDate, -1);
    } else {
      displayEnd = addDays(task.endDate, daysDelta);
      if (displayEnd <= task.startDate) displayEnd = addDays(task.startDate, 1);
    }
  }

  const { x, width } = taskToBar({ startDate: displayStart, endDate: displayEnd }, config);

  return (
    <div
      data-task-bar=""
      data-no-drag=""
      className={[
        'absolute top-1/2 -translate-y-1/2 h-7 rounded-md touch-none overflow-hidden select-none',
        isSelected && !isDragging ? 'ring-2 ring-white/75' : '',
        isDragging
          ? 'opacity-60 shadow-xl cursor-grabbing transition-none'
          : 'cursor-grab hover:opacity-90 hover:shadow-md transition-[background-color,box-shadow,opacity] duration-300 ease-out',
      ].join(' ')}
      style={{ left: x, width, backgroundColor: bgColor }}
      title={task.name}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        onPointerDown(e, task.id, 'move');
      }}
      onClick={(e) => {
        if (dragJustEndedRef.current) return;
        e.stopPropagation();
        onSelect(task.id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
    >
      <ResizeHandle taskId={task.id} side="left"  onPointerDown={onPointerDown} />
      <ResizeHandle taskId={task.id} side="right" onPointerDown={onPointerDown} />
    </div>
  );
}
