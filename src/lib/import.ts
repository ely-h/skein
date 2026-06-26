import type { Project, Task, TaskStatus, CustomStatus } from '../types/index';

const DATE_RE   = /^\d{4}-\d{2}-\d{2}$/;
const COLOR_RE  = /^#[0-9a-fA-F]{6}$/;
const MAX_STR   = 500;
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
  if (t.name.length > MAX_STR)
    throw new Error(`Tâche ${index} : "name" dépasse ${MAX_STR} caractères`);
  if (!isNullableDate(t.startDate))
    throw new Error(`Tâche ${index} : "startDate" doit être YYYY-MM-DD ou null`);
  if (!isNullableDate(t.endDate))
    throw new Error(`Tâche ${index} : "endDate" doit être YYYY-MM-DD ou null`);
  if (!isStatus(t.status))
    throw new Error(`Tâche ${index} : "status" invalide (backlog | not_started | in_progress | in_review | blocked | done | custom)`);
  if (t.parentId !== null && !isStr(t.parentId))
    throw new Error(`Tâche ${index} : "parentId" doit être une chaîne ou null`);
  if (isStr(t.parentId) && t.parentId === t.id)
    throw new Error(`Tâche ${index} : "parentId" ne peut pas pointer sur soi-même`);
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
    if (!COLOR_RE.test(cs.color as string))
      throw new Error(`Tâche ${index} : "customStatus.color" doit être une couleur hex (#RRGGBB)`);
    if ((cs.label as string).length > MAX_STR)
      throw new Error(`Tâche ${index} : "customStatus.label" dépasse ${MAX_STR} caractères`);
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

  // Vérifie que tous les parentId pointent vers des ids existants et sans cycle
  const idSet = new Set(tasks.map((t) => t.id));
  const parentMap = new Map(tasks.map((t) => [t.id, t.parentId]));
  for (const task of tasks) {
    if (task.parentId === null) continue;
    if (!idSet.has(task.parentId))
      throw new Error(`Tâche "${task.id}" : "parentId" référence un id inconnu`);
    // Remonte la chaîne pour détecter les cycles
    const visited = new Set<string>();
    let cursor: string | null = task.id;
    while (cursor !== null) {
      if (visited.has(cursor)) throw new Error(`Tâche "${task.id}" : cycle détecté dans "parentId"`);
      visited.add(cursor);
      cursor = parentMap.get(cursor) ?? null;
    }
  }

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
