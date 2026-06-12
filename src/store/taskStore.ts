import { create } from 'zustand';
import type { Task, TaskStatus } from '../types/index';
import { useProjectStore } from './projectStore';

export interface TaskInput {
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: TaskStatus;
}

interface TaskState {
  tasks: Task[];
  addTask: (input: TaskInput) => void;
  updateTask: (
    id: string,
    updates: Partial<Pick<Task, 'name' | 'startDate' | 'endDate' | 'status' | 'parentId'>>
  ) => void;
  deleteTask: (id: string) => void;
  /** Réorganise les tâches en affectant à chaque tâche l'index de sa position dans orderedIds. */
  reorderTasks: (orderedIds: string[]) => void;
}

function getActiveTasks(): Task[] {
  const { projects, activeProjectId } = useProjectStore.getState();
  return projects.find((p) => p.id === activeProjectId)?.tasks ?? [];
}

export const useTaskStore = create<TaskState>()((set) => {
  // Synchronise tasks dès que projectStore change (switch de projet inclus).
  useProjectStore.subscribe((state) => {
    const tasks =
      state.projects.find((p) => p.id === state.activeProjectId)?.tasks ?? [];
    set({ tasks });
  });

  return {
    tasks: getActiveTasks(),

    addTask(input: TaskInput): void {
      const { activeProjectId, _setProjectTasks } = useProjectStore.getState();
      if (!activeProjectId) return;
      const current = getActiveTasks();
      const task: Task = {
        id: crypto.randomUUID(),
        projectId: activeProjectId,
        parentId: null,
        order: current.length,
        ...input,
      };
      _setProjectTasks(activeProjectId, [...current, task]);
    },

    updateTask(
      id: string,
      updates: Partial<Pick<Task, 'name' | 'startDate' | 'endDate' | 'status' | 'parentId'>>
    ): void {
      const { activeProjectId, _setProjectTasks } = useProjectStore.getState();
      if (!activeProjectId) return;
      const updated = getActiveTasks().map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      _setProjectTasks(activeProjectId, updated);
    },

    deleteTask(id: string): void {
      const { activeProjectId, _setProjectTasks } = useProjectStore.getState();
      if (!activeProjectId) return;
      const filtered = getActiveTasks().filter((t) => t.id !== id);
      _setProjectTasks(activeProjectId, filtered);
    },

    reorderTasks(orderedIds: string[]): void {
      const { activeProjectId, _setProjectTasks } = useProjectStore.getState();
      if (!activeProjectId) return;
      const taskMap = new Map(getActiveTasks().map((t) => [t.id, t]));
      const reordered: Task[] = [];
      for (const [index, id] of orderedIds.entries()) {
        const task = taskMap.get(id);
        if (task !== undefined) {
          reordered.push({ ...task, order: index });
        }
      }
      _setProjectTasks(activeProjectId, reordered);
    },
  };
});
