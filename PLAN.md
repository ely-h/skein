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
- [x] 9. Multi-projet (sidebar + switch).
- [x] 9bis. Vue Liste : ViewSwitcher (Gantt <-> Liste) + tasklist (checkbox statut, nom, dates optionnelles). Même store, aucune logique pixel.
- [x] 10. Export PNG / PDF / JSON.
- [x] 11. Import JSON avec validation (refuse un JSON malformé proprement).
- [x] 12. Polish : transitions, états de tâches, dark/light, vert menthe.

## V2 — Améliorations

- [x] v2/01. Fix persist : `skipHydration` + `rehydrate()` pour éviter la perte de données au refresh. Tests de non-régression.
- [x] v2/02. UX polish : fond `#F8F7F4` light, gris `not_started` dark plus clair, barres +4px, boutons `rounded-xl`, favicon PNG.
- [x] v2/03. Sidebar redimensionnable (180–400 px), drag bord droit, largeur persistée en localStorage, sans interférence dnd-kit.
- [x] v2/fix. Timeline bounds dynamiques : la plage s'ajuste automatiquement pour toujours inclure toutes les tâches.
- [x] v2/04. Plage configurable manuellement : timelineStart/End par projet, sélecteur dans la Toolbar, impossible de réduire en dessous des dates des tâches.
- [x] v2/05. Largeur de colonne ajustable : slider Toolbar + drag bord de colonne dans le header, persistée par zoom en localStorage, toute logique via TimelineConfig.
- [x] v2/06. Export dropdown : bouton unique "Exporter" avec menu PNG / PDF / JSON, fermeture au clic extérieur.
- [x] v2/07. Sélection multiple : clic/Shift+clic/Ctrl+clic, highlight visuel, déplacement groupé du même delta, Échap désélectionne.
- [x] v2/08. Bornes auto-extensibles : drag/resize d'une tâche hors des bornes manuelles → timelineStart/End mis à jour en store avec padding (7j avant, 14j après).
- [x] v2/09. Réordonnage vertical : poignée dans la colonne des noms, drag vertical dnd-kit, champ `order` mis à jour dans le store, sans interférence avec le drag horizontal.

## V3 — PWA & partage

- [x] v3/05. Partage par URL : encode le projet en base64 dans l'URL, vue Gantt lecture seule sur `/share`.
- [x] v3/06. PWA : `vite-plugin-pwa`, service worker Workbox (cache offline complet, app shell + assets), manifest (icônes PNG multi-tailles, nom "Skein", thème vert menthe `#10b981`), installable desktop + mobile, routing SPA préservé.

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
