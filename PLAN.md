# PLAN — Gantt Maker

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

---

## V2

### Modèle de données — extensions v2
```ts
interface Project {
  id: string;
  name: string;
  createdAt: string;
  tasks: Task[];
  timelineStart: string;  // YYYY-MM-DD, date de début du Gantt
  timelineEnd: string;    // YYYY-MM-DD, date de fin du Gantt
}
```
`timelineStart` et `timelineEnd` remplacent le calcul automatique de la plage.
La plage est modifiable par l'utilisateur et peut être étendue à tout moment.

### Étapes v2 (même règle : une étape = un prompt = validée avant la suivante)

- [x] v2/01. Persistance : investiguer et corriger le bug de perte de données au refresh. Zustand persist doit survivre à un hard refresh. Ajouter un test de non-régression.
- [x] v2/02. UX polish : fond light mode `#F8F7F4` (blanc chaud), gris "à faire" plus clair en dark mode, hauteur des barres de tâches légèrement augmentée (+4px), border-radius des boutons plus arrondi (~12px), favicon `logo.png`.
- [x] v2/03. Sidebar redimensionnable : l'utilisateur peut tirer le bord droit de la sidebar pour l'élargir ou la rétrécir. Largeur min 180px, max 400px. Persister la largeur dans localStorage.
- [x] v2/04. Plage temporelle : chaque projet a une `timelineStart` et `timelineEnd` configurables. Un sélecteur de dates dans la Toolbar permet de les modifier. La plage peut être étendue mais pas réduite en dessous des tâches existantes.
- [x] v2/05. Largeur des colonnes ajustable : l'utilisateur peut élargir ou rétrécir la largeur d'une colonne (jour/semaine) via un slider ou drag sur le header. Persister par zoom level dans localStorage.
- [x] v2/06. Export dropdown : remplacer les boutons export séparés par un seul bouton avec dropdown menu (PNG / PDF / JSON). Même logique d'export, juste l'UI qui change.
- [x] v2/07. Sélection multiple + déplacement groupé : clic + shift ou clic + ctrl pour sélectionner plusieurs tâches. Déplacer le groupe d'un même delta de jours. Highlight visuel des tâches sélectionnées.
- [x] v2/08. Bornes du Gantt : empêcher le drag/resize d'une tâche hors de la plage `timelineStart`/`timelineEnd`. Une tâche ne peut pas sortir des bornes visibles.
- [x] v2/09. Réordonnage des tâches : drag & drop vertical dans la colonne des noms pour réordonner les tâches (changer leur `order`). Mettre à jour le store en temps réel.
- [x] v2/10. Landing page : page d'accueil avec logo, nom, description courte, CTA "Ouvrir l'app". Style cohérent avec l'app (même tokens Tailwind). Route `/` = landing, `/app` = l'app.

### Esthétique v2
- Light mode : fond `#F8F7F4`, pas de blanc pur.
- Dark mode : gris "à faire" (not_started) plus clair pour être lisible.
- Boutons : border-radius ~12px.
- Barres de tâches : hauteur augmentée de ~4px par rapport à la v1.
- Favicon : `logo.png` à la racine dans `public/`.

---

## V3

### Objectifs
Partage, installabilité, fluidité, raccourcis clavier, et drag vertical des barres.

### Étapes v3 (même règle : une étape = un prompt = validée avant la suivante)

- [x] v3/01. Fix couleur de sélection light mode : le vert de sélection est trop clair et invisible. Remplacer par un vert grisé plus foncé et lisible (ex. `#4a7c6a` ou similaire). Auditer tous les états hover/focus/selected sur les barres et boutons en light mode.
- [x] v3/02. Drag vertical des barres : en plus du drag horizontal (déplacement temporel), une barre peut être tirée verticalement pour changer l'ordre de la tâche (`order`). Le drag vertical ne doit pas déclencher de déplacement horizontal. Différencier les deux axes dès le début du drag (seuil de détection ~8px). S'appuyer sur le hook `useTaskDrag.ts` existant.
- [x] v3/03. Raccourcis clavier : `Delete`/`Backspace` supprime la tâche sélectionnée (avec confirmation), `Escape` désélectionne tout et ferme les modales, `Ctrl+Z` undo (dernière action), `Ctrl+Y` redo. L'undo/redo couvre : création, suppression, déplacement, resize de tâche. Implémenter une pile d'historique dans le store (`lib/history.ts`), max 50 actions.
- [x] v3/04. Smooth UI : passer en revue toutes les interactions et ajouter des transitions fluides. Barres de tâches : transition de couleur au changement de statut (300ms ease). Sidebar : transition d'ouverture/fermeture. Dropdown export : animation d'apparition (fade + slide léger). Hover sur les barres : légère élévation (box-shadow). Drag : curseur `grab`/`grabbing`. Aucune transition sur les mouvements de drag (ça doit rester instantané pour ne pas sembler laggy).
- [x] v3/05. Partage via URL : un bouton "Partager" dans la Toolbar encode le projet actif en base64 dans l'URL (`/share?data=...`). La page `/share` affiche le Gantt en lecture seule avec un bouton "Importer dans Skein" qui ajoute le projet au store local. Valider et sanitizer le contenu décodé avant import (même logique que `lib/import.ts`). Attention à la limite de longueur des URLs (~8000 chars) : afficher un warning si le projet est trop grand.
- [x] v3/06. PWA : configurer `vite-plugin-pwa` avec un service worker. Cache offline complet (app shell + assets). Manifest avec `logo.png` comme icône, nom "Skein", thème vert menthe. Installable sur desktop et mobile. Le service worker ne doit pas casser le routing React.

### Esthétique v3
- Couleur de sélection light mode : vert grisé foncé, visible sur fond `#F8F7F4`.
- Transitions : 200-300ms ease, jamais sur les drags.
- Curseur `grab` sur les barres, `grabbing` pendant le drag, `ew-resize` sur les bords de resize.
- Smooth partout, sans jamais sacrifier la réactivité.

---

## V4

### Objectifs
Bugfixes critiques, nouveaux statuts, état vide propre, déplacement bouton nouvelle tâche.

### Nouveaux statuts (extension du modèle)
```ts
type TaskStatus =
  | 'backlog'        // à planifier, pas encore priorisé — gris foncé
  | 'not_started'    // à faire — gris clair
  | 'in_progress'    // en cours — baby blue
  | 'in_review'      // en validation — jaune/ambre
  | 'blocked'        // bloqué — rouge/corail
  | 'done'           // terminé — vert menthe
  | 'custom';        // statut personnalisé (nom + couleur libres)
```
Pour les statuts custom, étendre `Task` avec :
```ts
interface Task {
  // ... existant
  customStatus?: {
    label: string;
    color: string; // hex
  };
}
```
Les couleurs par défaut des nouveaux statuts sont overridables via `themeStore.ts` comme les autres.

### Étapes v4

- [x] v4/01. Bugfix drag tâche : pendant le drag horizontal d'une tâche, seule la barre se déplace. Le scroll de la timeline ne se déclenche que quand la barre atteint une zone de 60px depuis le bord gauche ou droit de la zone visible (auto-scroll on drag). Avant d'atteindre cette zone, le calendrier ne bouge pas du tout.
- [x] v4/02. État vide sans projet : quand il n'y a aucun projet, ne pas afficher la timeline vide. Afficher un écran centré avec le logo, un message court ("Aucun projet pour l'instant") et un bouton "Créer un projet". Même style que la landing page.
- [x] v4/03. Bouton nouvelle tâche : retirer le bouton "+ Nouvelle tâche" de la Toolbar. L'ajouter en bas de la liste des tâches (colonne gauche du Gantt et vue Liste), sous la dernière tâche, style discret ("+ Nouvelle tâche" en texte léger). Il ne doit apparaître nulle part ailleurs.
- [x] v4/04. Nouveaux statuts : ajouter `backlog`, `in_review`, `blocked` au type `TaskStatus`. Mettre à jour `themeStore.ts` avec leurs couleurs par défaut (backlog = gris foncé, in_review = ambre, blocked = corail/rouge). Mettre à jour tous les composants qui affichent ou filtrent par statut.
- [x] v4/05. Statut custom : l'utilisateur peut créer des statuts personnalisés (nom + couleur hex). Géré dans `themeStore.ts`. Dans le formulaire de tâche, un option "Personnalisé..." ouvre un mini-form (label + color picker). Le champ `customStatus` est stocké sur la tâche. Affichage cohérent avec les autres statuts dans les barres et la vue liste.

### Esthétique v4
- Backlog : gris foncé (`#6B7280`).
- In review : ambre (`#F59E0B`).
- Blocked : corail (`#EF4444`).
- Statut custom : couleur choisie par l'utilisateur.
- Écran vide : même tokens que la landing page, centré, aéré.

---

## V5

### Objectifs
Bugfixes UI (alignement, plage Gantt, fond opaque), repositionnement des boutons "nouveau",
liste de tâches plus robuste, zoom en dropdown, thèmes prédéfinis.

### Étapes v5 (même règle : une étape = un prompt = validée avant la suivante)

- [x] v5/01. Retirer le nom de la tâche affiché à l'intérieur de la barre du Gantt. Le nom reste visible uniquement dans la colonne des labels à gauche et en vue Liste.
- [x] v5/02. Fix alignement : la bordure du bas de la colonne "Projets" (sidebar) et celle de la Toolbar doivent être sur la même ligne horizontale. Auditer les hauteurs des deux éléments et aligner précisément (même `height` ou variable CSS partagée).
- [x] v5/03. Bugfix plage du Gantt : actuellement si `timelineStart`/`timelineEnd` sont fixées (ex. 13/06 au 20/06), la zone de drag affiche une plage bien plus large (ex. jusqu'en août) car `resolveTimelineBounds()` applique un `minDays` par zoom qui écrase la plage manuelle. Corriger pour que la plage manuelle soit toujours respectée et prioritaire sur le minimum de zoom. Plafonner la plage totale à 52 semaines (1 an) maximum et 1 semaine minimum. Si l'utilisateur essaie de dépasser, bloquer avec un message clair.
- [x] v5/04. Colonne des tâches redimensionnable + fond opaque (panel fixe séparé du calendrier, scroll vertical synchronisé).
- [x] v5/05. Zoom en dropdown (bouton "Zoom" avec menu déroulant Jour/Semaine/Mois).
- [x] v5/06. Thèmes prédéfinis : White / Light / Dark / Black via CSS variables, sélecteur dans le panneau palette, persisté en localStorage.

### Esthétique v5
- Barres du Gantt : pas de texte à l'intérieur, juste la couleur de statut.
- Plage Gantt : 1 semaine à 52 semaines, plage manuelle toujours respectée.
- Boutons "nouveau" : intégrés dans leurs listes respectives, pas de bouton flottant détaché.
- Thèmes : White (`#FFFFFF`), Light (`#F8F7F4`), Dark (actuel), Black (`#0A0A0A`).