import { useEffect } from 'react';
import { useProjectStore } from './store/projectStore';
import { useTaskStore } from './store/taskStore';
import GanttChart from './components/gantt/GanttChart';

function seedIfEmpty(): void {
  const { projects, addProject } = useProjectStore.getState();
  if (projects.length > 0) return;
  addProject('Refonte site web');
  const { addTask } = useTaskStore.getState();
  addTask({ name: 'Rédaction contenu',    startDate: '2025-06-02', endDate: '2025-06-15', status: 'done' });
  addTask({ name: 'Maquettes UI',         startDate: '2025-06-02', endDate: '2025-06-08', status: 'in_progress' });
  addTask({ name: 'Développement front',  startDate: '2025-06-09', endDate: '2025-06-22', status: 'not_started' });
  addTask({ name: 'Tests & recette',      startDate: '2025-06-16', endDate: '2025-06-25', status: 'not_started' });
  addTask({ name: 'Mise en production',   startDate: '2025-06-26', endDate: '2025-06-27', status: 'not_started' });
}

export default function App() {
  useEffect(() => { seedIfEmpty(); }, []);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="flex-none flex items-center px-6 h-12 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <h1 className="text-base font-semibold tracking-tight">Skein</h1>
      </header>
      <GanttChart />
    </div>
  );
}
