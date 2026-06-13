import type { Task, TaskStatus } from '../../types/index';
import type { TimelineConfig } from '../../lib/timeline';
import { LABEL_W, ROW_H, TOTAL_DAYS } from './constants';
import TaskBar from './TaskBar';

const STATUS_DOT: Record<TaskStatus, string> = {
  not_started: 'bg-neutral-300 dark:bg-neutral-600',
  in_progress: 'bg-sky-400 dark:bg-sky-500',
  done:        'bg-emerald-400 dark:bg-emerald-500',
};

interface Props {
  task:   Task;
  config: TimelineConfig;
  onEdit: (id: string) => void;
}

function PencilIcon() {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function TaskRow({ task, config, onEdit }: Props) {
  const isScheduled = task.startDate !== null && task.endDate !== null;

  return (
    <div
      className="group flex border-b border-neutral-100 dark:border-neutral-700/60 transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
      style={{ height: ROW_H }}
    >
      {/* Étiquette — reste visible lors du scroll horizontal */}
      <div
        className="sticky left-0 z-10 flex-none flex items-center gap-2 px-3 bg-white dark:bg-neutral-800 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 transition-colors cursor-default"
        data-no-drag=""
        style={{ width: LABEL_W }}
      >
        {/* Point de statut */}
        <div className={`flex-none w-1.5 h-1.5 rounded-full ${STATUS_DOT[task.status]}`} />

        <span className="truncate text-sm text-neutral-700 dark:text-neutral-300 flex-1 min-w-0">
          {task.name}
        </span>

        <button
          type="button"
          className="flex-none p-1 rounded-md opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-150"
          onClick={() => onEdit(task.id)}
          title="Modifier"
        >
          <PencilIcon />
        </button>
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
