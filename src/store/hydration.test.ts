import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Project, Task } from '../types/index';

const makeStorageMock = (): Storage => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  } as Storage;
};

describe('persist rehydration — non-régression', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    vi.resetModules();
    mockStorage = makeStorageMock();
    vi.stubGlobal('window', { localStorage: mockStorage });
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('taskStore.tasks reflète les données du localStorage après réhydratation', async () => {
    const task: Task = {
      id: 'task-1',
      projectId: 'proj-1',
      name: 'Première tâche',
      startDate: '2024-01-10',
      endDate: '2024-01-20',
      status: 'not_started',
      parentId: null,
      order: 0,
    };
    const project: Project = {
      id: 'proj-1',
      name: 'Projet test',
      createdAt: '2024-01-01',
      tasks: [task],
    };

    mockStorage.setItem(
      'skein-projects',
      JSON.stringify({
        state: { projects: [project], activeProjectId: 'proj-1' },
        version: 0,
      }),
    );

    const { useTaskStore } = await import('./taskStore');

    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('task-1');
    expect(tasks[0].name).toBe('Première tâche');
    expect(tasks[0].startDate).toBe('2024-01-10');
    expect(tasks[0].status).toBe('not_started');
  });

  it('taskStore.tasks est vide si aucun projet en localStorage', async () => {
    const { useTaskStore } = await import('./taskStore');

    expect(useTaskStore.getState().tasks).toHaveLength(0);
  });

  it('taskStore.tasks reflète le bon projet actif parmi plusieurs', async () => {
    const projects: Project[] = [
      {
        id: 'proj-a',
        name: 'Projet A',
        createdAt: '2024-01-01',
        tasks: [
          {
            id: 'ta-1',
            projectId: 'proj-a',
            name: 'Tâche A',
            startDate: null,
            endDate: null,
            status: 'not_started',
            parentId: null,
            order: 0,
          },
        ],
      },
      {
        id: 'proj-b',
        name: 'Projet B',
        createdAt: '2024-01-01',
        tasks: [
          {
            id: 'tb-1',
            projectId: 'proj-b',
            name: 'Tâche B',
            startDate: null,
            endDate: null,
            status: 'done',
            parentId: null,
            order: 0,
          },
        ],
      },
    ];

    mockStorage.setItem(
      'skein-projects',
      JSON.stringify({
        state: { projects, activeProjectId: 'proj-b' },
        version: 0,
      }),
    );

    const { useTaskStore } = await import('./taskStore');

    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('tb-1');
  });
});
