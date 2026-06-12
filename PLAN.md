# PLAN — Skein

Application web de création de diagrammes de Gantt. Front-end uniquement, zéro backend.
Granularité : jour. Horizon : quelques semaines à quelques mois.

## Stack
- React 19 + TypeScript (strict)
- Vite (build/dev)
- Tailwind v4 (style)
- Zustand + persist (state + localStorage)
- dnd-kit (drag / resize / move)
- date-fns (calculs de dates)
- html-to-image + jsPDF (export PNG/PDF)

## Règle d'or anti-spaghetti
Toute conversion date <-> pixel passe UNIQUEMENT par `lib/timeline.ts`.
`types/` et `lib/` ne dépendent de rien (logique pure, testable).
Les composants consomment les stores, jamais l'inverse.

## Modèle de données (figé étape 1, ne pas casser)
```ts
type TaskStatus = 'not_started' | 'in_progress' | 'done';
// not_started -> gris clair | in_progress -> baby blue | done -> vert menthe

interface Task {
  id: string;
  projectId: string;
  name: string;
  startDate: string | null;   // ISO 'YYYY-MM-DD' | null = pas planifiée (liste seule)
  endDate: string | null;     // ISO, inclusif | null
  status: TaskStatus;
  parentId: string | null;    // null en v1, porte ouverte hiérarchie
  order: number;
}
// Une tâche sans dates existe en vue Liste mais n'apparaît pas dans le Gantt.

interface Project {
  id: string;
  name: string;
  createdAt: string;
  tasks: Task[];
}
```

## Étapes (une étape = un prompt = validée visuellement avant la suivante)

- [x] 1. Setup Vite/TS/Tailwind + figer `types/index.ts`. Rien d'autre.
- [x] 2. `lib/dates.ts` + `lib/timeline.ts` (logique pure conversion date<->pixel). Tests dessus.
- [x] 3. Stores Zustand (projet + tâches) + persist localStorage.
- [x] 4. Gantt statique lecture seule : header temporel + grille + barres depuis données en dur. Aucune interaction.
- [x] 5. Création de tâche basique (bouton + formulaire). CRUD complet.
- [x] 6. Drag-create : tirer à la souris sur la grille pour créer une barre.
- [x] 7. Move + resize d'une barre existante.
- [x] 8. Zoom jour / semaine / mois.
- [ ] 9. Multi-projet (sidebar + switch).
- [ ] 9bis. Vue Liste : ViewSwitcher (Gantt <-> Liste) + tasklist (checkbox statut, nom, dates optionnelles). Même store, aucune logique pixel.
- [ ] 10. Export PNG / PDF / JSON.
- [ ] 11. Import JSON avec validation (refuse un JSON malformé proprement).
- [ ] 12. Polish : transitions, états de tâches, dark/light, vert menthe.

## Esthétique
- Épuré, sobre, moderne. Coins ni trop sharp ni trop arrondis (radius ~6-8px).
- Accent : vert menthe. États tâches : gris clair / baby blue / vert menthe.
- Dark + light mode.

## Architecture cible
```
src/
├── types/index.ts
├── store/{projectStore,taskStore}.ts
├── lib/{dates,timeline,export,import}.ts
├── components/
│   ├── views/{ViewSwitcher,GanttView,ListView}.tsx
│   ├── gantt/{GanttChart,GanttHeader,GanttGrid,TaskRow,TaskBar,TaskList}.tsx
│   ├── list/{TaskListView,TaskListItem}.tsx
│   ├── sidebar/ProjectSidebar.tsx
│   ├── toolbar/Toolbar.tsx
│   └── ui/
├── hooks/{useDragCreate,useTaskDrag}.ts
├── App.tsx
└── main.tsx
```
