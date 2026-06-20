import { useTaskStore } from '../../store/taskStore';
import TaskListItem from './TaskListItem';

interface Props {
  onEdit:    (id: string) => void;
  onNewTask: () => void;
}

function NewTaskButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Nouvelle tâche
    </button>
  );
}

export default function TaskListView({ onEdit, onNewTask }: Props) {
  const tasks       = useTaskStore((s) => s.tasks);
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  if (sortedTasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
          Aucune tâche pour l'instant.
        </div>
        <NewTaskButton onClick={onNewTask} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <ul>
        {sortedTasks.map((task) => (
          <TaskListItem key={task.id} task={task} onEdit={onEdit} />
        ))}
      </ul>
      <NewTaskButton onClick={onNewTask} />
    </div>
  );
}
