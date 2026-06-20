export type TaskStatus =
  | 'backlog'
  | 'not_started'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'done'
  | 'custom';
export type ZoomLevel = 'day' | 'week' | 'month';
export type ViewMode  = 'gantt' | 'list';

export interface CustomStatus {
  label: string;
  color: string; // hex
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  startDate: string | null; // ISO 'YYYY-MM-DD' | null = pas planifiée (liste seule)
  endDate: string | null;   // ISO, inclusif | null
  status: TaskStatus;
  customStatus?: CustomStatus; // renseigné uniquement si status === 'custom'
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
