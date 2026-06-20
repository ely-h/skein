import { useSortable } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../../types/index';
import { ROW_H } from './constants';
import { useThemeStore } from '../../store/themeStore';

const STATUS_DOT: Record<TaskStatus, string> = {
  backlog:     'bg-neutral-500 dark:bg-neutral-400',
  not_started: 'bg-neutral-300 dark:bg-neutral-500',
  in_progress: 'bg-sky-400 dark:bg-sky-500',
  in_review:   'bg-amber-400 dark:bg-amber-500',
  blocked:     'bg-red-400 dark:bg-red-500',
  done:        'bg-emerald-400 dark:bg-emerald-500',
  custom:      '',
};

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

interface Props {
  task:       Task;
  onEdit:     (id: string) => void;
  isSelected: boolean;
  onSelect:   (id: string, additive: boolean) => void;
}

export default function TaskLabelRow({ task, onEdit, isSelected, onSelect }: Props) {
  const customStatuses = useThemeStore((s) => s.customStatuses);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const dotColor = task.status === 'custom'
    ? (task.customStatus?.color ?? customStatuses.find(cs => cs.label === task.customStatus?.label)?.color ?? '#a78bfa')
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={[
        'group flex items-center gap-1.5 px-2 border-b border-[#EDEBE5] dark:border-neutral-700/60 transition-colors cursor-default select-none',
        isSelected
          ? 'bg-[#D0E5DF] dark:bg-emerald-950/30'
          : 'bg-[#F8F7F4] dark:bg-neutral-800 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700/50',
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
      {/* Grip */}
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

      {/* Dot statut */}
      {task.status === 'custom' ? (
        <div className="flex-none w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      ) : (
        <div className={`flex-none w-1.5 h-1.5 rounded-full transition-colors duration-300 ease-out ${STATUS_DOT[task.status]}`} />
      )}

      {/* Nom */}
      <span className="truncate text-sm text-neutral-700 dark:text-neutral-300 flex-1 min-w-0">
        {task.name}
      </span>

      {/* Éditer */}
      <button
        type="button"
        className="flex-none p-1 rounded-xl opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-[#EDE9E3] dark:hover:bg-neutral-700 transition-all duration-150"
        onClick={(e) => { e.stopPropagation(); onEdit(task.id); }}
        title="Modifier"
      >
        <PencilIcon />
      </button>
    </div>
  );
}
