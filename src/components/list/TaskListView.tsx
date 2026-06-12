import { useTaskStore } from '../../store/taskStore';
import TaskListItem from './TaskListItem';

interface Props {
  onEdit: (id: string) => void;
}

export default function TaskListView({ onEdit }: Props) {
  const tasks       = useTaskStore((s) => s.tasks);
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  if (sortedTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
        Aucune tâche. Créez-en une avec "Nouvelle tâche".
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul>
        {sortedTasks.map((task) => (
          <TaskListItem key={task.id} task={task} onEdit={onEdit} />
        ))}
      </ul>
    </div>
  );
}
