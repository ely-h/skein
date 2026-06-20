import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TaskStatus } from '../types/index';

export const DEFAULT_STATUS_COLORS: Record<TaskStatus, string> = {
  backlog:     '#6B7280',
  not_started: '#d4d4d4',
  in_progress: '#38bdf8',
  in_review:   '#F59E0B',
  blocked:     '#EF4444',
  done:        '#34d399',
};

interface ThemeState {
  statusColors:    Record<TaskStatus, string>;
  setStatusColor:  (status: TaskStatus, color: string) => void;
  resetColors:     () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      statusColors: { ...DEFAULT_STATUS_COLORS },
      setStatusColor: (status, color) =>
        set((s) => ({ statusColors: { ...s.statusColors, [status]: color } })),
      resetColors: () => set({ statusColors: { ...DEFAULT_STATUS_COLORS } }),
    }),
    {
      name: 'skein-status-colors',
      // Fusionne les defaults avec le stocké pour que les nouveaux statuts
      // apparaissent avec leur couleur par défaut chez les utilisateurs existants.
      merge: (persisted, current) => ({
        ...current,
        statusColors: { ...DEFAULT_STATUS_COLORS, ...(persisted as ThemeState).statusColors },
      }),
    },
  ),
);
