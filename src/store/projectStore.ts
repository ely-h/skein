import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Task } from '../types/index';
import { today } from '../lib/dates';

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  addProject: (name: string) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  /** Utilisé uniquement par taskStore pour écrire les tâches d'un projet. */
  _setProjectTasks: (projectId: string, tasks: Task[]) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,

      addProject(name: string): void {
        const project: Project = {
          id: crypto.randomUUID(),
          name: name.trim(),
          createdAt: today(),
          tasks: [],
        };
        set((state) => ({
          projects: [...state.projects, project],
          activeProjectId: project.id,
        }));
      },

      renameProject(id: string, name: string): void {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, name: name.trim() } : p
          ),
        }));
      },

      deleteProject(id: string): void {
        set((state) => {
          const remaining = state.projects.filter((p) => p.id !== id);
          const nextActiveId =
            state.activeProjectId === id
              ? (remaining[0]?.id ?? null)
              : state.activeProjectId;
          return { projects: remaining, activeProjectId: nextActiveId };
        });
      },

      setActiveProject(id: string): void {
        set({ activeProjectId: id });
      },

      _setProjectTasks(projectId: string, tasks: Task[]): void {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, tasks } : p
          ),
        }));
      },
    }),
    {
      name: 'skein-projects',
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
