import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TaskStatus, CustomStatus } from '../types/index';

export const DEFAULT_STATUS_COLORS: Record<TaskStatus, string> = {
  backlog:     '#6B7280',
  not_started: '#d4d4d4',
  in_progress: '#38bdf8',
  in_review:   '#F59E0B',
  blocked:     '#EF4444',
  done:        '#34d399',
  custom:      '#a78bfa',
};

interface ThemeState {
  statusColors:       Record<TaskStatus, string>;
  customStatuses:     CustomStatus[];
  setStatusColor:     (status: TaskStatus, color: string) => void;
  resetColors:        () => void;
  addCustomStatus:    (cs: CustomStatus) => void;
  removeCustomStatus: (label: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      statusColors:   { ...DEFAULT_STATUS_COLORS },
      customStatuses: [],
      setStatusColor: (status, color) =>
        set((s) => ({ statusColors: { ...s.statusColors, [status]: color } })),
      resetColors: () => set({ statusColors: { ...DEFAULT_STATUS_COLORS } }),
      addCustomStatus: (cs) =>
        set((s) => {
          const exists = s.customStatuses.some((x) => x.label === cs.label);
          return exists
            ? { customStatuses: s.customStatuses.map((x) => x.label === cs.label ? cs : x) }
            : { customStatuses: [...s.customStatuses, cs] };
        }),
      removeCustomStatus: (label) =>
        set((s) => ({ customStatuses: s.customStatuses.filter((x) => x.label !== label) })),
    }),
    {
      name: 'skein-status-colors',
      merge: (persisted, current) => ({
        ...current,
        statusColors: { ...DEFAULT_STATUS_COLORS, ...(persisted as ThemeState).statusColors },
        customStatuses: (persisted as ThemeState).customStatuses ?? [],
      }),
    },
  ),
);
