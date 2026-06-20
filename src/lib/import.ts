import type { Project, Task, TaskStatus, CustomStatus } from '../types/index';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_STATUSES: readonly TaskStatus[] = ['backlog', 'not_started', 'in_progress', 'in_review', 'blocked', 'done', 'custom'];

function isStr(v: unknown): v is string {
  return typeof v === 'string';
}

function isValidDate(v: unknown): boolean {
  return isStr(v) && DATE_RE.test(v) && !isNaN(Date.parse(v));
}

function isNullableDate(v: unknown): v is string | null {
  return v === null || isValidDate(v);
}

function isStatus(v: unknown): v is TaskStatus {
  return isStr(v) && (VALID_STATUSES as readonly string[]).includes(v);
}

function validateTask(raw: unknown, index: number): Task {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`Tâche ${index} : objet attendu`);
  }
  const t = raw as Record<string, unknown>;

  if (!isStr(t.id) || !t.id)
    throw new Error(`Tâche ${index} : champ "id" manquant ou invalide`);
  if (!isStr(t.projectId))
    throw new Error(`Tâche ${index} : champ "projectId" manquant`);
  if (!isStr(t.name) || !t.name.trim())
    throw new Error(`Tâche ${index} : champ "name" manquant ou vide`);
  if (!isNullableDate(t.startDate))
    throw new Error(`Tâche ${index} : "startDate" doit être YYYY-MM-DD ou null`);
  if (!isNullableDate(t.endDate))
    throw new Error(`Tâche ${index} : "endDate" doit être YYYY-MM-DD ou null`);
  if (!isStatus(t.status))
    throw new Error(`Tâche ${index} : "status" invalide (backlog | not_started | in_progress | in_review | blocked | done | custom)`);
  if (t.parentId !== null && !isStr(t.parentId))
    throw new Error(`Tâche ${index} : "parentId" doit être une chaîne ou null`);
  if (typeof t.order !== 'number' || !isFinite(t.order))
    throw new Error(`Tâche ${index} : "order" doit être un nombre`);

  let customStatus: CustomStatus | undefined;
  if (t.status === 'custom') {
    if (
      typeof t.customStatus !== 'object' ||
      t.customStatus === null ||
      !isStr((t.customStatus as Record<string, unknown>).label) ||
      !isStr((t.customStatus as Record<string, unknown>).color)
    ) {
      throw new Error(`Tâche ${index} : "customStatus" requis (label + color) quand status === 'custom'`);
    }
    const cs = t.customStatus as Record<string, unknown>;
    customStatus = { label: cs.label as string, color: cs.color as string };
  }

  return {
    id:        t.id,
    projectId: t.projectId,
    name:      t.name,
    startDate: t.startDate as string | null,
    endDate:   t.endDate as string | null,
    status:    t.status,
    customStatus,
    parentId:  t.parentId as string | null,
    order:     t.order,
  };
}

export function parseProjectJson(text: string): Project {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Fichier invalide : JSON malformé');
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Format invalide : objet JSON attendu à la racine');
  }

  const obj = raw as Record<string, unknown>;

  if (!isStr(obj.id) || !obj.id)
    throw new Error('Champ "id" manquant ou invalide');
  if (!isStr(obj.name) || !obj.name.trim())
    throw new Error('Champ "name" manquant ou vide');
  if (!isStr(obj.createdAt) || !obj.createdAt)
    throw new Error('Champ "createdAt" manquant');
  if (!Array.isArray(obj.tasks))
    throw new Error('Champ "tasks" doit être un tableau');

  const tasks = obj.tasks.map((t, i) => validateTask(t, i + 1));

  // timelineStart / timelineEnd sont optionnels (rétro-compat avec les exports avant v2/04)
  if (obj.timelineStart !== undefined && !isNullableDate(obj.timelineStart))
    throw new Error('"timelineStart" doit être YYYY-MM-DD ou null');
  if (obj.timelineEnd !== undefined && !isNullableDate(obj.timelineEnd))
    throw new Error('"timelineEnd" doit être YYYY-MM-DD ou null');

  return {
    id:            obj.id,
    name:          obj.name,
    createdAt:     obj.createdAt,
    tasks,
    timelineStart: (obj.timelineStart as string | null | undefined) ?? null,
    timelineEnd:   (obj.timelineEnd   as string | null | undefined) ?? null,
  };
}
