export type TaskStatus = 'not_started' | 'in_progress' | 'done';
export type ZoomLevel = 'day' | 'week' | 'month';
export type ViewMode  = 'gantt' | 'list';
// not_started -> gris clair | in_progress -> baby blue | done -> vert menthe

export interface Task {
  id: string;
  projectId: string;
  name: string;
  startDate: string | null; // ISO 'YYYY-MM-DD' | null = pas planifiée (liste seule)
  endDate: string | null;   // ISO, inclusif | null
  status: TaskStatus;
  parentId: string | null;  // null en v1, porte ouverte hiérarchie
  order: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  tasks: Task[];
  timelineStart: string | null; // null = plage auto calculée
  timelineEnd:   string | null; // null = plage auto calculée
}
