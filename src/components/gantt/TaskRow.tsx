import type { Task } from '../../types/index';
import type { TimelineConfig } from '../../lib/timeline';
import { ROW_H } from './constants';
import TaskBar from './TaskBar';

interface Props {
  task:          Task;
  config:        TimelineConfig;
  isSelected:    boolean;
  isInGroupDrag: boolean;
  onSelect:      (id: string, additive: boolean) => void;
}

export default function TaskRow({ task, config, isSelected, isInGroupDrag, onSelect }: Props) {
  const isScheduled = task.startDate !== null && task.endDate !== null;

  return (
    <div
      className="flex border-b border-[#EDEBE5] dark:border-neutral-700/60"
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
            isInGroupDrag={isInGroupDrag}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}
