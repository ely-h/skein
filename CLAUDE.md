# CLAUDE.md — Règles du projet Gantt Maker

## Contexte
Application web de Gantt maker, front-end pur, zéro backend. Voir `PLAN.md` pour
le découpage en étapes. On avance UNE étape à la fois, validée avant la suivante.

## Stack imposée (ne pas dévier sans demander)
React 19 + TypeScript strict, Vite, Tailwind v4, Zustand (+ persist), dnd-kit,
date-fns, html-to-image + jsPDF. Gestionnaire de paquets : npm.

## Workflow obligatoire
- Avant de coder, relire l'étape courante dans `PLAN.md` et s'y tenir.
- Ne JAMAIS faire plusieurs étapes du PLAN en une fois. Une étape = un livrable.
- À la fin d'une étape, cocher la case correspondante dans `PLAN.md`.
- Si un détail manque ou est ambigu : DEMANDER, ne pas inventer / halluciner.

## Style de code
- TypeScript strict, pas de `any`. Typer explicitement les retours de fonctions.
- Clean code, modulaire, jamais spaghetti. Fonctions courtes, responsabilité unique.
- Privilégier des patches ciblés. Ne pas régénérer un fichier entier pour un petit changement.
- Pas de commentaires inutiles. Commenter le POURQUOI, pas le QUOI.
- Pas d'emoji dans le code ni dans l'UI.
- Nommage : composants en PascalCase, fonctions/variables en camelCase, types en PascalCase.

## Règles d'architecture (NON négociables)
- Toute conversion date <-> pixel passe UNIQUEMENT par `lib/timeline.ts`.
- `types/` et `lib/` ne dépendent d'aucun composant ni store (logique pure).
- Les composants consomment les stores ; les stores n'importent jamais de composant.
- Le modèle de données dans `types/index.ts` est un contrat : ne pas le casser
  sans prévenir et expliquer l'impact.
- Deux vues (Gantt + Liste) partagent le MÊME store, une seule source de vérité.
  Une tâche sans dates (startDate/endDate null) existe en Liste mais pas dans le Gantt.

## Robustesse & sécurité
- Valider toute entrée externe (notamment l'import JSON) avant de l'utiliser.
  Un JSON malformé doit être rejeté proprement, jamais crasher l'app.
- Gérer les cas limites des dates : endDate < startDate, durée nulle, dates null
  (tâche non planifiée), etc. Le Gantt ne doit afficher que les tâches ayant des dates.
- Pas de dépendance superflue : justifier tout ajout de package.

## Tests
- Tests uniquement sur `lib/dates.ts` et `lib/timeline.ts` (logique pure critique).
- Le reste est validé visuellement, pas besoin de sur-tester l'UI en v1.

## Langue
- Code et noms de variables en anglais.
- Commentaires et messages d'UI en français.

## Git
- Chaque étape du PLAN se fait sur une branche dédiée : step/01-setup, step/02-timeline, etc.
- Commits atomiques avec des messages en anglais, format conventionnel : feat:, fix:, refactor:, test:
- Ne jamais push directement sur main. Merger uniquement quand l'étape est validée visuellement.
- Toujours vérifier qu'on est sur la bonne branche avant de commencer à coder.