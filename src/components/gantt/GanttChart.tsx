import { useRef, useEffect, useMemo } from 'react';
import { DndContext } from '@dnd-kit/core';
import { useProjectStore } from '../../store/projectStore';
import { useTaskStore } from '../../store/taskStore';
import type { TimelineConfig } from '../../lib/timeline';
import type { ZoomLevel } from '../../types/index';
import { useDragCreate } from '../../hooks/useDragCreate';
import { useTaskDrag } from '../../hooks/useTaskDrag';
import { LABEL_W, HEADER_WEEK_H, HEADER_DAY_H, ROW_H, ZOOM_CONFIGS } from './constants';
import GanttHeader from './GanttHeader';
import GanttGrid from './GanttGrid';
import TaskRow from './TaskRow';

const CHART_START = '2026-06-01';
const HEADER_H    = HEADER_WEEK_H + HEADER_DAY_H;

interface Props {
  zoom:         ZoomLevel;
  onEditTask:   (id: string) => void;
  onDragCreate: (startDate: string, endDate: string) => void;
}

export default function GanttChart({ zoom, onEditTask, onDragCreate }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const tasks           = useTaskStore((s) => s.tasks);
  const projects        = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const sortedTasks   = [...tasks].sort((a, b) => a.order - b.order);

  const config = useMemo<TimelineConfig>(() => ({
    startDate: CHART_START,
    ...ZOOM_CONFIGS[zoom],
  }), [zoom]);

  const totalW = LABEL_W + config.totalDays * config.dayWidth;

  // Drag-create : tirer sur la grille vide pour créer une barre.
  const { preview, onMouseDown, result, clearResult } =
    useDragCreate(config, scrollRef, LABEL_W);

  useEffect(() => {
    if (!result) return;
    onDragCreate(result.startDate, result.endDate);
    clearResult();
  }, [result, onDragCreate, clearResult]);

  // Move / resize des barres existantes via dnd-kit.
  const { sensors, onDragStart, onDragMove, onDragEnd } = useTaskDrag(config);

  const gridRows = Math.max(sortedTasks.length, 3);

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto select-none" style={{ minWidth: 0 }}>
      <div style={{ width: totalW }}>

        {/* Header — collé en haut lors du scroll vertical */}
        <div
          className="sticky top-0 z-20 flex bg-white dark:bg-neutral-800 border-b-2 border-neutral-200 dark:border-neutral-700"
          style={{ height: HEADER_H }}
        >
          <div
            className="sticky left-0 z-30 flex-none flex items-center px-4 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
            style={{ width: LABEL_W }}
          >
            <span className="truncate">{activeProject?.name ?? 'Gantt'}</span>
          </div>
          <GanttHeader config={config} zoom={zoom} />
        </div>

        {/* Corps — drag-create + move/resize via DndContext */}
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        >
          <div
            className="relative cursor-crosshair"
            style={{ minHeight: gridRows * ROW_H }}
            onMouseDown={onMouseDown}
          >
            <GanttGrid config={config} zoom={zoom} rowCount={gridRows} />

            {sortedTasks.length > 0 ? (
              sortedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  config={config}
                  onEdit={onEditTask}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-sm text-neutral-400 pointer-events-none">
                Tirez sur la grille pour créer une tâche
              </div>
            )}

            {/* Aperçu drag-create */}
            {preview && (
              <div
                className="absolute top-0 z-[8] pointer-events-none rounded-sm bg-emerald-400/25 border-x border-emerald-500/50"
                style={{ left: LABEL_W + preview.x, width: preview.width, height: '100%' }}
              />
            )}
          </div>
        </DndContext>

      </div>
    </div>
  );
}
