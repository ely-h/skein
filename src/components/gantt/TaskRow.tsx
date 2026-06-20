import type { Task } from '../../types/index';
import type { TimelineConfig } from '../../lib/timeline';
import type { ActiveDrag } from '../../hooks/useBarDrag';
import { ROW_H } from './constants';
import TaskBar from './TaskBar';

type DragType = 'move' | 'resize-left' | 'resize-right';

interface Props {
  task:             Task;
  config:           TimelineConfig;
  isSelected:       boolean;
  activeDrag:       ActiveDrag | null;
  dragJustEndedRef: React.RefObject<boolean>;
  onPointerDown:    (e: React.PointerEvent, taskId: string, type: DragType) => void;
  onSelect:         (id: string, additive: boolean) => void;
}

export default function TaskRow({
  task, config, isSelected, activeDrag, dragJustEndedRef, onPointerDown, onSelect,
}: Props) {
  const isScheduled = task.startDate !== null && task.endDate !== null;

  return (
    <div
      className="flex border-b border-[#EDEBE5] dark:border-[var(--border)]/60"
      style={{ height: ROW_H }}
    >
      <div
        className="relative flex-1"
        style={{ width: config.totalDays * config.dayWidth }}
      >
        {isScheduled && (
          <TaskBar
            task={task as Task & { startDate: string; endDate: string }}
            config={config}
            isSelected={isSelected}
            activeDrag={activeDrag}
            dragJustEndedRef={dragJustEndedRef}
            onPointerDown={onPointerDown}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}
