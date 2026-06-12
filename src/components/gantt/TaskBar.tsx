import { taskToBar } from '../../lib/timeline';
import type { TimelineConfig } from '../../lib/timeline';
import type { Task, TaskStatus } from '../../types/index';

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'bg-neutral-300 dark:bg-neutral-600',
  in_progress: 'bg-sky-400 dark:bg-sky-500',
  done: 'bg-emerald-400 dark:bg-emerald-500',
};

interface Props {
  task: Task & { startDate: string; endDate: string };
  config: TimelineConfig;
}

export default function TaskBar({ task, config }: Props) {
  const { x, width } = taskToBar({ startDate: task.startDate, endDate: task.endDate }, config);

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md ${STATUS_COLORS[task.status]}`}
      style={{ left: x, width }}
      title={task.name}
    />
  );
}
