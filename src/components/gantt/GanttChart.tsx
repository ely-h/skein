import { useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useTaskStore } from '../../store/taskStore';
import type { TimelineConfig } from '../../lib/timeline';
import { useDragCreate } from '../../hooks/useDragCreate';
import { DAY_W, LABEL_W, TOTAL_DAYS, HEADER_WEEK_H, HEADER_DAY_H, ROW_H } from './constants';
import GanttHeader from './GanttHeader';
import GanttGrid from './GanttGrid';
import TaskRow from './TaskRow';

const CHART_CONFIG: TimelineConfig = {
  startDate: '2026-06-01',
  totalDays: TOTAL_DAYS,
  dayWidth: DAY_W,
};

const HEADER_H = HEADER_WEEK_H + HEADER_DAY_H;
const TOTAL_W  = LABEL_W + TOTAL_DAYS * DAY_W;

interface Props {
  onEditTask:   (id: string) => void;
  onDragCreate: (startDate: string, endDate: string) => void;
}

export default function GanttChart({ onEditTask, onDragCreate }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const tasks          = useTaskStore((s) => s.tasks);
  const projects       = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const sortedTasks   = [...tasks].sort((a, b) => a.order - b.order);

  const { preview, onMouseDown, result, clearResult } =
    useDragCreate(CHART_CONFIG, scrollRef, LABEL_W);

  // Ouvre le formulaire dès qu'un drag se termine.
  useEffect(() => {
    if (!result) return;
    onDragCreate(result.startDate, result.endDate);
    clearResult();
  }, [result, onDragCreate, clearResult]);

  // Nombre minimal de lignes pour que la zone soit draggable même à vide.
  const gridRows = Math.max(sortedTasks.length, 3);

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto select-none" style={{ minWidth: 0 }}>
      <div style={{ width: TOTAL_W }}>

        {/* Header — collé en haut lors du scroll vertical */}
        <div
          className="sticky top-0 z-20 flex bg-white dark:bg-neutral-950 border-b-2 border-neutral-200 dark:border-neutral-800"
          style={{ height: HEADER_H }}
        >
          <div
            className="sticky left-0 z-30 flex-none flex items-center px-4 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
            style={{ width: LABEL_W }}
          >
            <span className="truncate">{activeProject?.name ?? 'Gantt'}</span>
          </div>
          <GanttHeader config={CHART_CONFIG} />
        </div>

        {/* Corps — zone de drag-create */}
        <div
          className="relative cursor-crosshair"
          style={{ minHeight: gridRows * ROW_H }}
          onMouseDown={onMouseDown}
        >
          <GanttGrid config={CHART_CONFIG} rowCount={gridRows} />

          {sortedTasks.length > 0 ? (
            sortedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                config={CHART_CONFIG}
                onEdit={onEditTask}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-neutral-400 pointer-events-none">
              Tirez sur la grille pour créer une tâche
            </div>
          )}

          {/* Aperçu du drag en cours */}
          {preview && (
            <div
              className="absolute top-0 z-[8] pointer-events-none rounded-sm bg-emerald-400/25 border-x border-emerald-500/50"
              style={{
                left:   LABEL_W + preview.x,
                width:  preview.width,
                height: '100%',
              }}
            />
          )}
        </div>

      </div>
    </div>
  );
}
