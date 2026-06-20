import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useProjectStore } from './store/projectStore';
import { useTaskStore } from './store/taskStore';
import { useHistoryStore } from './store/historyStore';
import { resolveTimelineBounds, DAY_WIDTH_BOUNDS } from './lib/timeline';
import { ZOOM_CONFIGS } from './components/gantt/constants';
import { useColumnWidth } from './hooks/useColumnWidth';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import GanttChart from './components/gantt/GanttChart';
import TaskFormModal from './components/gantt/TaskFormModal';
import TaskListView from './components/list/TaskListView';
import Toolbar from './components/toolbar/Toolbar';
import ProjectSidebar from './components/sidebar/ProjectSidebar';
import { exportToPng, exportToPdf, exportToJson } from './lib/export';
import { parseProjectJson } from './lib/import';
import { buildShareUrl } from './lib/share';
import { useDarkMode } from './hooks/useDarkMode';
import EmptyState from './components/ui/EmptyState';
import type { ZoomLevel, ViewMode } from './types/index';

interface DragDates { start: string; end: string }

export default function App() {
  const activeProjectId   = useProjectStore((s) => s.activeProjectId);
  const hasProjects       = useProjectStore((s) => s.projects.length > 0);
  const activeProject     = useProjectStore((s) =>
    s.projects.find((p) => p.id === s.activeProjectId) ?? null
  );
  const importProject     = useProjectStore((s) => s.importProject);
  const setTimelineRange  = useProjectStore((s) => s.setTimelineRange);
  const tasks             = useTaskStore((s) => s.tasks);
  const deleteTask        = useTaskStore((s) => s.deleteTask);

  const { dark, toggle: toggleDark } = useDarkMode();
  const { widths, setWidth } = useColumnWidth();

  const ganttRef     = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen,      setModalOpen]      = useState(false);
  const [editingTaskId,  setEditingTaskId]  = useState<string | null>(null);
  const [dragDates,      setDragDates]      = useState<DragDates | null>(null);
  const [zoom,           setZoom]           = useState<ZoomLevel>('day');
  const [view,           setView]           = useState<ViewMode>('gantt');
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Largeur de colonne pour le zoom courant
  const dayWidth    = widths[zoom];
  const dayWidthMin = DAY_WIDTH_BOUNDS[zoom].min;
  const dayWidthMax = DAY_WIDTH_BOUNDS[zoom].max;

  const handleDayWidthChange = useCallback((w: number): void => {
    setWidth(zoom, w);
  }, [zoom, setWidth]);

  // Plage temporelle résolue pour la toolbar
  const timelineStart = activeProject?.timelineStart ?? null;
  const timelineEnd   = activeProject?.timelineEnd   ?? null;
  const { effectiveStart, effectiveEnd, taskEarliestDate, taskLatestDate } = useMemo(() => {
    const minDays = ZOOM_CONFIGS[zoom].totalDays;
    const resolved = resolveTimelineBounds(tasks, timelineStart, timelineEnd, minDays);
    const dated = tasks.filter(
      (t): t is typeof t & { startDate: string; endDate: string } =>
        t.startDate !== null && t.endDate !== null,
    );
    const taskEarliestDate = dated.length > 0
      ? [...dated.map((t) => t.startDate)].sort()[0]
      : null;
    const taskLatestDate = dated.length > 0
      ? [...dated.map((t) => t.endDate)].sort().at(-1)!
      : null;
    return {
      effectiveStart:  resolved.startDate,
      effectiveEnd:    resolved.endDate,
      taskEarliestDate,
      taskLatestDate,
    };
  }, [tasks, timelineStart, timelineEnd, zoom]);

  const [isExporting,  setIsExporting]  = useState(false);
  const [importError,  setImportError]  = useState<string | null>(null);
  const [shareLabel,   setShareLabel]   = useState('Partager');
  const [shareWarning, setShareWarning] = useState<string | null>(null);

  // Réinitialise sélection + historique lors d'un changement de projet
  useEffect(() => {
    setSelectedIds(new Set());
    setDeleteConfirmId(null);
    useHistoryStore.getState().reset();
  }, [activeProjectId]);

  const closeModal = useCallback((): void => {
    setModalOpen(false);
    setDragDates(null);
  }, []);

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

  const handleConfirmDelete = useCallback((): void => {
    if (!deleteConfirmId) return;
    deleteTask(deleteConfirmId);
    setDeleteConfirmId(null);
    setSelectedIds(new Set());
  }, [deleteConfirmId, deleteTask]);

  const handleCancelDelete = useCallback((): void => {
    setDeleteConfirmId(null);
  }, []);

  // Raccourcis clavier — ne s'appliquent que pour une sélection unique
  const singleSelectedId = selectedIds.size === 1 ? [...selectedIds][0] : null;

  useKeyboardShortcuts({
    selectedId: singleSelectedId,
    onUndo:      useCallback(() => useHistoryStore.getState().undo(), []),
    onRedo:      useCallback(() => useHistoryStore.getState().redo(), []),
    onEscape:    useCallback((): void => {
      setSelectedIds(new Set());
      setDeleteConfirmId(null);
      closeModal();
    }, [closeModal]),
    onDeleteKey: useCallback((): void => {
      if (singleSelectedId) setDeleteConfirmId(singleSelectedId);
    }, [singleSelectedId]),
  });

  const handleExportPng = useCallback(async (): Promise<void> => {
    if (!ganttRef.current || !activeProject) return;
    setIsExporting(true);
    try {
      await exportToPng(ganttRef.current, activeProject.name);
    } finally {
      setIsExporting(false);
    }
  }, [activeProject]);

  const handleExportPdf = useCallback(async (): Promise<void> => {
    if (!ganttRef.current || !activeProject) return;
    setIsExporting(true);
    try {
      await exportToPdf(ganttRef.current, activeProject.name);
    } finally {
      setIsExporting(false);
    }
  }, [activeProject]);

  const handleExportJson = useCallback((): void => {
    if (!activeProject) return;
    exportToJson(activeProject);
  }, [activeProject]);

  const handleImportClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleTimelineRangeChange = useCallback((start: string | null, end: string | null): void => {
    if (!activeProject) return;
    setTimelineRange(activeProject.id, start, end);
  }, [activeProject, setTimelineRange]);

  const handleShare = useCallback(async (): Promise<void> => {
    if (!activeProject) return;
    const { url, oversized } = buildShareUrl(activeProject);
    if (oversized) {
      setShareWarning('Attention : le projet est volumineux (lien > 6 000 car.). Certains navigateurs pourraient tronquer l\'URL.');
      setTimeout(() => setShareWarning(null), 8000);
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel('Lien copié !');
      setTimeout(() => setShareLabel('Partager'), 2000);
    } catch {
      // Fallback si l'API Clipboard n'est pas disponible (ex. HTTP non-sécurisé)
      prompt('Copiez ce lien de partage :', url);
    }
  }, [activeProject]);

  const handleFileChange = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const project = parseProjectJson(text);
      importProject(project);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setImportError(message);
      setTimeout(() => setImportError(null), 6000);
    }
  }, [importProject]);

  const deleteConfirmTask = deleteConfirmId
    ? tasks.find((t) => t.id === deleteConfirmId) ?? null
    : null;

  return (
    <div className="h-screen flex flex-col bg-[#F8F7F4] dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
      <header className="flex-none flex items-center justify-between px-6 h-12 border-b border-[#E8E6E1] dark:border-neutral-700 shrink-0">
        <h1 className="text-base font-semibold tracking-tight">Skein</h1>
        <button
          type="button"
          onClick={openNewTask}
          disabled={!activeProjectId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle tâche
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar />

        {!hasProjects ? (
          <EmptyState />
        ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <Toolbar
            view={view}            onViewChange={setView}
            zoom={zoom}            onZoomChange={setZoom}
            dark={dark}            onToggleDark={toggleDark}
            onExportPng={handleExportPng}
            onExportPdf={handleExportPdf}
            onExportJson={handleExportJson}
            isExporting={isExporting}
            hasProject={!!activeProjectId}
            onImportClick={handleImportClick}
            onShare={handleShare}
            shareLabel={shareLabel}
            dayWidth={dayWidth}
            dayWidthMin={dayWidthMin}
            dayWidthMax={dayWidthMax}
            onDayWidthChange={handleDayWidthChange}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            effectiveStart={effectiveStart}
            effectiveEnd={effectiveEnd}
            taskEarliestDate={taskEarliestDate}
            taskLatestDate={taskLatestDate}
            onTimelineRangeChange={handleTimelineRangeChange}
          />
          {importError && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
              <span>{importError}</span>
              <button
                type="button"
                onClick={() => setImportError(null)}
                className="flex-none font-medium hover:underline"
              >
                Fermer
              </button>
            </div>
          )}
          {shareWarning && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
              <span>{shareWarning}</span>
              <button
                type="button"
                onClick={() => setShareWarning(null)}
                className="flex-none font-medium hover:underline"
              >
                Fermer
              </button>
            </div>
          )}
          {deleteConfirmTask && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
              <span>
                Supprimer <strong>{deleteConfirmTask.name}</strong> ? Cette action sera annulable via Ctrl+Z.
              </span>
              <div className="flex items-center gap-3 flex-none">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="font-medium hover:underline"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
          {view === 'gantt' ? (
            <GanttChart
              ref={ganttRef}
              zoom={zoom}
              dayWidth={dayWidth}
              onDayWidthChange={handleDayWidthChange}
              onEditTask={openEditTask}
              onDragCreate={openDragCreate}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
            />
          ) : (
            <TaskListView onEdit={openEditTask} />
          )}
        </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

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
