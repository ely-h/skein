import type { Task } from '../types/index';

const MAX_SIZE = 50;

export interface HistoryEntry {
  projectId:   string;
  tasksBefore: Task[];
  tasksAfter:  Task[];
}

export interface HistoryStack {
  past:   HistoryEntry[];
  future: HistoryEntry[];
}

export function emptyStack(): HistoryStack {
  return { past: [], future: [] };
}

export function stackPush(h: HistoryStack, entry: HistoryEntry): HistoryStack {
  return {
    past:   [...h.past, entry].slice(-MAX_SIZE),
    future: [],
  };
}

export function stackUndo(h: HistoryStack): { stack: HistoryStack; entry: HistoryEntry } | null {
  if (h.past.length === 0) return null;
  const entry = h.past[h.past.length - 1];
  return {
    entry,
    stack: { past: h.past.slice(0, -1), future: [entry, ...h.future] },
  };
}

export function stackRedo(h: HistoryStack): { stack: HistoryStack; entry: HistoryEntry } | null {
  if (h.future.length === 0) return null;
  const entry = h.future[0];
  return {
    entry,
    stack: { past: [...h.past, entry], future: h.future.slice(1) },
  };
}
