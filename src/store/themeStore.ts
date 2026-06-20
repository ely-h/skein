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

export type AppTheme = 'white' | 'light' | 'dark' | 'black';

interface ThemeState {
  statusColors:       Record<TaskStatus, string>;
  customStatuses:     CustomStatus[];
  appTheme:           AppTheme;
  setStatusColor:     (status: TaskStatus, color: string) => void;
  resetColors:        () => void;
  addCustomStatus:    (cs: CustomStatus) => void;
  removeCustomStatus: (label: string) => void;
  setAppTheme:        (theme: AppTheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      statusColors:   { ...DEFAULT_STATUS_COLORS },
      customStatuses: [],
      appTheme:       'light',
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
      setAppTheme: (theme) => set({ appTheme: theme }),
    }),
    {
      name: 'skein-status-colors',
      merge: (persisted, current) => ({
        ...current,
        statusColors:   { ...DEFAULT_STATUS_COLORS, ...(persisted as ThemeState).statusColors },
        customStatuses: (persisted as ThemeState).customStatuses ?? [],
        appTheme:       (persisted as ThemeState).appTheme ?? 'light',
      }),
    },
  ),
);
