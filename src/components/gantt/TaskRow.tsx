import { useSortable } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../../types/index';
import type { TimelineConfig } from '../../lib/timeline';
import { LABEL_W, ROW_H } from './constants';
import TaskBar from './TaskBar';

const STATUS_DOT: Record<TaskStatus, string> = {
  not_started: 'bg-neutral-300 dark:bg-neutral-500',
  in_progress: 'bg-sky-400 dark:bg-sky-500',
  done:        'bg-emerald-400 dark:bg-emerald-500',
};

interface Props {
  task:          Task;
  config:        TimelineConfig;
  onEdit:        (id: string) => void;
  isSelected:    boolean;
  isInGroupDrag: boolean;
  onSelect:      (id: string, additive: boolean) => void;
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

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="4" cy="2"  r="1.2" />
      <circle cx="8" cy="2"  r="1.2" />
      <circle cx="4" cy="6"  r="1.2" />
      <circle cx="8" cy="6"  r="1.2" />
      <circle cx="4" cy="10" r="1.2" />
      <circle cx="8" cy="10" r="1.2" />
    </svg>
  );
}

export default function TaskRow({ task, config, onEdit, isSelected, isInGroupDrag, onSelect }: Props) {
  const isScheduled = task.startDate !== null && task.endDate !== null;

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      className={[
        'group flex border-b border-neutral-100 dark:border-neutral-700/60 transition-colors',
        isSelected
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          : 'hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40',
        isDragging ? 'opacity-60 shadow-md' : '',
      ].join(' ')}
      style={{
        height: ROW_H,
        transform: transform ? `translate3d(0, ${Math.round(transform.y)}px, 0)` : undefined,
        transition,
        zIndex: isDragging ? 50 : undefined,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(task.id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
    >
      {/* Étiquette — reste visible lors du scroll horizontal */}
      <div
        className={[
          'sticky left-0 z-10 flex-none flex items-center gap-1.5 px-2 border-r border-neutral-200 dark:border-neutral-700 transition-colors cursor-default',
          isSelected
            ? 'bg-emerald-50 dark:bg-emerald-950/30 group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-950/40'
            : 'bg-[#F8F7F4] dark:bg-neutral-800 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800',
        ].join(' ')}
        data-no-drag=""
        style={{ width: LABEL_W }}
      >
        {/* Poignée de réordonnage vertical */}
        <div
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex-none p-0.5 rounded opacity-0 group-hover:opacity-100 text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 cursor-grab active:cursor-grabbing transition-opacity"
          title="Réordonner"
          onClick={(e) => e.stopPropagation()}
        >
          <GripIcon />
        </div>

        <div className={`flex-none w-1.5 h-1.5 rounded-full ${STATUS_DOT[task.status]}`} />

        <span className="truncate text-sm text-neutral-700 dark:text-neutral-300 flex-1 min-w-0">
          {task.name}
        </span>

        <button
          type="button"
          className="flex-none p-1 rounded-xl opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-150"
          onClick={(e) => { e.stopPropagation(); onEdit(task.id); }}
          title="Modifier"
        >
          <PencilIcon />
        </button>
      </div>

      {/* Zone barre */}
      <div
        className="relative flex-none"
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
