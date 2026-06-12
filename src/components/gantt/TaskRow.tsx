import type { Task } from '../../types/index';
import type { TimelineConfig } from '../../lib/timeline';
import { LABEL_W, ROW_H, TOTAL_DAYS } from './constants';
import TaskBar from './TaskBar';

interface Props {
  task: Task;
  config: TimelineConfig;
}

export default function TaskRow({ task, config }: Props) {
  const isScheduled = task.startDate !== null && task.endDate !== null;

  return (
    <div
      className="flex border-b border-neutral-100 dark:border-neutral-800/60"
      style={{ height: ROW_H }}
    >
      {/* Étiquette — reste visible lors du scroll horizontal */}
      <div
        className="sticky left-0 z-10 flex-none flex items-center px-4 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 text-sm text-neutral-700 dark:text-neutral-300"
        style={{ width: LABEL_W }}
      >
        <span className="truncate">{task.name}</span>
      </div>

      {/* Zone barre */}
      <div
        className="relative flex-none"
        style={{ width: TOTAL_DAYS * config.dayWidth }}
      >
        {isScheduled && (
          <TaskBar
            task={task as Task & { startDate: string; endDate: string }}
            config={config}
          />
        )}
      </div>
    </div>
  );
}
