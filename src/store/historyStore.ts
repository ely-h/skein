import { create } from 'zustand';
import { emptyStack, stackPush, stackUndo, stackRedo } from '../lib/history';
import type { HistoryStack } from '../lib/history';
import type { Task } from '../types/index';
import { useProjectStore } from './projectStore';

interface HistoryState extends HistoryStack {
  canUndo: boolean;
  canRedo: boolean;
  push:    (projectId: string, tasksBefore: Task[], tasksAfter: Task[]) => void;
  undo:    () => void;
  redo:    () => void;
  reset:   () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  ...emptyStack(),
  canUndo: false,
  canRedo: false,

  push(projectId, tasksBefore, tasksAfter) {
    const next = stackPush(get(), { projectId, tasksBefore, tasksAfter });
    set({ ...next, canUndo: true, canRedo: false });
  },

  undo() {
    const result = stackUndo(get());
    if (!result) return;
    const { stack, entry } = result;
    useProjectStore.getState()._setProjectTasks(entry.projectId, entry.tasksBefore);
    set({ ...stack, canUndo: stack.past.length > 0, canRedo: stack.future.length > 0 });
  },

  redo() {
    const result = stackRedo(get());
    if (!result) return;
    const { stack, entry } = result;
    useProjectStore.getState()._setProjectTasks(entry.projectId, entry.tasksAfter);
    set({ ...stack, canUndo: stack.past.length > 0, canRedo: stack.future.length > 0 });
  },

  reset() {
    set({ ...emptyStack(), canUndo: false, canRedo: false });
  },
}));
