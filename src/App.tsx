import { useEffect, useState, useCallback } from 'react';
import { useProjectStore } from './store/projectStore';
import { useTaskStore } from './store/taskStore';
import GanttChart from './components/gantt/GanttChart';
import TaskFormModal from './components/gantt/TaskFormModal';
import TaskListView from './components/list/TaskListView';
import Toolbar from './components/toolbar/Toolbar';
import ProjectSidebar from './components/sidebar/ProjectSidebar';
import type { ZoomLevel, ViewMode } from './types/index';

function seedIfEmpty(): void {
  const { projects, addProject } = useProjectStore.getState();
  if (projects.length > 0) return;
  addProject('Refonte site web');
  const { addTask } = useTaskStore.getState();
  addTask({ name: 'Rédaction contenu',   startDate: '2026-06-01', endDate: '2026-06-14', status: 'done' });
  addTask({ name: 'Maquettes UI',        startDate: '2026-06-01', endDate: '2026-06-07', status: 'in_progress' });
  addTask({ name: 'Développement front', startDate: '2026-06-08', endDate: '2026-06-21', status: 'not_started' });
  addTask({ name: 'Tests & recette',     startDate: '2026-06-15', endDate: '2026-06-24', status: 'not_started' });
  addTask({ name: 'Mise en production',  startDate: '2026-06-25', endDate: '2026-06-26', status: 'not_started' });
}

interface DragDates { start: string; end: string }

export default function App() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [dragDates,     setDragDates]     = useState<DragDates | null>(null);
  const [zoom,          setZoom]          = useState<ZoomLevel>('day');
  const [view,          setView]          = useState<ViewMode>('gantt');

  useEffect(() => { seedIfEmpty(); }, []);

  const openNewTask = useCallback((): void => {
    setDragDates(null);
    setEditingTaskId(null);
    setModalOpen(true);
  }, []);

  const openEditTask = useCallback((id: string): void => {
    setDragDates(null);
    setEditingTaskId(id);
    setModalOpen(true);
  }, []);

  const openDragCreate = useCallback((startDate: string, endDate: string): void => {
    setDragDates({ start: startDate, end: endDate });
    setEditingTaskId(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback((): void => {
    setModalOpen(false);
    setDragDates(null);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="flex-none flex items-center justify-between px-6 h-12 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <h1 className="text-base font-semibold tracking-tight">Skein</h1>
        <button
          type="button"
          onClick={openNewTask}
          disabled={!activeProjectId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle tâche
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Toolbar
            view={view}         onViewChange={setView}
            zoom={zoom}         onZoomChange={setZoom}
          />
          {view === 'gantt' ? (
            <GanttChart
              zoom={zoom}
              onEditTask={openEditTask}
              onDragCreate={openDragCreate}
            />
          ) : (
            <TaskListView onEdit={openEditTask} />
          )}
        </div>
      </div>

      {modalOpen && (
        <TaskFormModal
          taskId={editingTaskId}
          initialStartDate={dragDates?.start}
          initialEndDate={dragDates?.end}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
