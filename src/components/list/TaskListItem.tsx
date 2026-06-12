import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Task, TaskStatus } from '../../types/index';
import { parseDate } from '../../lib/dates';
import { useTaskStore } from '../../store/taskStore';

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  not_started: 'in_progress',
  in_progress: 'done',
  done:        'not_started',
};

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'done') {
    return (
      <div className="w-4 h-4 rounded-full bg-emerald-400 dark:bg-emerald-500 flex items-center justify-center flex-none">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (status === 'in_progress') {
    return (
      <div className="w-4 h-4 rounded-full border-2 border-sky-400 dark:border-sky-500 bg-sky-400/25 dark:bg-sky-500/20 flex-none" />
    );
  }
  return (
    <div className="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600 flex-none" />
  );
}

interface Props {
  task:   Task;
  onEdit: (id: string) => void;
}

export default function TaskListItem({ task, onEdit }: Props) {
  const updateTask = useTaskStore((s) => s.updateTask);

  const [editingName, setEditingName] = useState(false);
  const [nameValue,   setNameValue]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingName) inputRef.current?.focus(); }, [editingName]);

  function cycleStatus(): void {
    updateTask(task.id, { status: NEXT_STATUS[task.status] });
  }

  function startEdit(): void {
    setNameValue(task.name);
    setEditingName(true);
  }

  function commitEdit(): void {
    if (nameValue.trim()) updateTask(task.id, { name: nameValue.trim() });
    setEditingName(false);
  }

  const hasDates = task.startDate !== null && task.endDate !== null;

  function fmtDate(iso: string): string {
    return format(parseDate(iso), 'd MMM', { locale: fr });
  }

  return (
    <li className="group flex items-center gap-3 px-6 py-2.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">

      {/* Icône de statut (cycle au clic) */}
      <button
        type="button"
        onClick={cycleStatus}
        title="Changer le statut"
        className="flex-none"
      >
        <StatusIcon status={task.status} />
      </button>

      {/* Nom de la tâche — éditable en ligne */}
      {editingName ? (
        <input
          ref={inputRef}
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditingName(false);
          }}
          className="flex-1 bg-transparent border-b border-emerald-500 outline-none text-sm text-neutral-900 dark:text-neutral-100 py-0.5"
        />
      ) : (
        <span
          onClick={startEdit}
          className={[
            'flex-1 text-sm cursor-text truncate select-none',
            task.status === 'done'
              ? 'line-through text-neutral-400 dark:text-neutral-500'
              : 'text-neutral-800 dark:text-neutral-200',
          ].join(' ')}
        >
          {task.name}
        </span>
      )}

      {/* Dates (si présentes) */}
      {hasDates && (
        <span className="flex-none text-xs text-neutral-400 dark:text-neutral-500 tabular-nums whitespace-nowrap">
          {fmtDate(task.startDate!)} – {fmtDate(task.endDate!)}
        </span>
      )}

      {/* Bouton d'édition complète */}
      <button
        type="button"
        onClick={() => onEdit(task.id)}
        title="Modifier"
        className="flex-none opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-opacity"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

    </li>
  );
}
