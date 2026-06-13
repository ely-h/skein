# Skein

Skein est un outil de planification en diagramme de Gantt fait maison. Le constat de départ est simple : les alternatives en ligne sont soit payantes, soit franchement moches, soit les deux. L'objectif était donc d'avoir quelque chose de sobre et agréable à utiliser, sans compte à créer ni abonnement à souscrire.

Le projet a été développé en vibe-coding assisté par IA, avec une architecture pensée dès le départ pour rester propre et maintenable malgré ce mode de développement.

![capture d'écran](./docs/screenshot.png)

---

## Fonctionnalités

**Gantt**
- Création de tâches par drag sur le calendrier
- Déplacement et redimensionnement des barres à la souris
- Zoom jour, semaine ou mois
- Week-ends grisés

**Tâches**
- Trois états : pas commencé, en cours, terminé
- Vue liste et vue Gantt sur les mêmes données
- Les tâches sans dates apparaissent uniquement en vue liste

**Projets**
- Gestion de plusieurs projets indépendants
- Export PNG, PDF, JSON
- Import depuis un fichier JSON pour reconstruire un Gantt existant

**Interface**
- Dark mode et light mode
- Données sauvegardées localement dans le navigateur, rien n'est envoyé nulle part

---

## Stack

React 19, TypeScript strict, Vite, Tailwind v4, Zustand, dnd-kit, date-fns, jsPDF, html-to-image.

---

## Lancer le projet en local

```bash
git clone https://github.com/ely-h/skein.git
cd skein
npm install
npm run dev
```

L'app tourne sur `http://localhost:5173`.

```bash
npm run build   # build de production
npm run test    # lance les tests
```

---

## Architecture

Le projet suit une séparation stricte entre logique et UI. `types/` et `lib/` sont de la logique pure sans aucune dépendance vers les composants. Les composants consomment les stores Zustand, et toute conversion date/pixel passe uniquement par `lib/timeline.ts`. Cette contrainte évite que le code parte en spaghetti au fil des ajouts.

```
src/
├── types/        # contrats de données (Task, Project, TaskStatus)
├── store/        # état global (Zustand + persist localStorage)
├── lib/          # logique pure (dates, timeline, export, import)
├── components/   # UI (gantt/, list/, sidebar/, toolbar/, ui/)
└── hooks/        # drag-create, move, resize
```

---

## Démo

Disponible sur [ely-h.github.io/skein](https://ely-h.github.io/skein)

---

## Licence

MIT — faites-en ce que vous voulez.