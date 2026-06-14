import { create } from 'zustand';
import type { Task, TaskStatus } from '../types/index';
import { useProjectStore } from './projectStore';
import { useHistoryStore } from './historyStore';

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
    updates: Partial<Pick<Task, 'name' | 'startDate' | 'endDate' | 'status' | 'parentId'>>,
    options?: { record?: boolean }
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

  // L'abonnement est en place : on peut maintenant déclencher l'hydratation
  // de projectStore depuis localStorage sans risque de race condition.
  useProjectStore.persist.rehydrate();

  return {
    tasks: getActiveTasks(),

    addTask(input: TaskInput): void {
      const { activeProjectId, _setProjectTasks } = useProjectStore.getState();
      if (!activeProjectId) return;
      const tasksBefore = getActiveTasks();
      const task: Task = {
        id: crypto.randomUUID(),
        projectId: activeProjectId,
        parentId: null,
        order: tasksBefore.length,
        ...input,
      };
      const tasksAfter = [...tasksBefore, task];
      _setProjectTasks(activeProjectId, tasksAfter);
      useHistoryStore.getState().push(activeProjectId, tasksBefore, tasksAfter);
    },

    updateTask(id, updates, options): void {
      const { activeProjectId, _setProjectTasks } = useProjectStore.getState();
      if (!activeProjectId) return;
      const tasksBefore = getActiveTasks();
      const tasksAfter  = tasksBefore.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      _setProjectTasks(activeProjectId, tasksAfter);
      // record=true par défaut sauf si l'appelant (drag) opte pour le silence
      if (options?.record !== false) {
        useHistoryStore.getState().push(activeProjectId, tasksBefore, tasksAfter);
      }
    },

    deleteTask(id: string): void {
      const { activeProjectId, _setProjectTasks } = useProjectStore.getState();
      if (!activeProjectId) return;
      const tasksBefore = getActiveTasks();
      const tasksAfter  = tasksBefore.filter((t) => t.id !== id);
      _setProjectTasks(activeProjectId, tasksAfter);
      useHistoryStore.getState().push(activeProjectId, tasksBefore, tasksAfter);
    },

    reorderTasks(orderedIds: string[]): void {
      const { activeProjectId, _setProjectTasks } = useProjectStore.getState();
      if (!activeProjectId) return;
      const tasksBefore = getActiveTasks();
      const taskMap = new Map(tasksBefore.map((t) => [t.id, t]));
      const tasksAfter: Task[] = [];
      for (const [index, id] of orderedIds.entries()) {
        const task = taskMap.get(id);
        if (task !== undefined) {
          tasksAfter.push({ ...task, order: index });
        }
      }
      _setProjectTasks(activeProjectId, tasksAfter);
      useHistoryStore.getState().push(activeProjectId, tasksBefore, tasksAfter);
    },
  };
});
