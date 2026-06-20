import { useRef, useEffect, useMemo, useCallback, forwardRef } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useProjectStore } from '../../store/projectStore';
import { useTaskStore } from '../../store/taskStore';
import type { TimelineConfig } from '../../lib/timeline';
import { resolveTimelineBounds, computeRequiredBoundsExpansion } from '../../lib/timeline';
import type { ZoomLevel } from '../../types/index';
import { useDragCreate } from '../../hooks/useDragCreate';
import { useTaskDrag } from '../../hooks/useTaskDrag';
import { useLabelResize } from '../../hooks/useLabelResize';
import { HEADER_WEEK_H, HEADER_DAY_H, ROW_H, ZOOM_CONFIGS } from './constants';
import GanttHeader from './GanttHeader';
import GanttGrid from './GanttGrid';
import TaskRow from './TaskRow';

const HEADER_H = HEADER_WEEK_H + HEADER_DAY_H;

interface Props {
  zoom:             ZoomLevel;
  dayWidth:         number;
  onDayWidthChange: (w: number) => void;
  onEditTask:       (id: string) => void;
  onDragCreate:     (startDate: string, endDate: string) => void;
  selectedIds:      Set<string>;
  onSelectChange:   (ids: Set<string>) => void;
}

const GanttChart = forwardRef<HTMLDivElement, Props>(function GanttChart(
  { zoom, dayWidth, onDayWidthChange, onEditTask, onDragCreate, selectedIds, onSelectChange },
  chartRef,
) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const tasks            = useTaskStore((s) => s.tasks);
  const reorderTasks     = useTaskStore((s) => s.reorderTasks);
  const projects         = useProjectStore((s) => s.projects);
  const activeProjectId  = useProjectStore((s) => s.activeProjectId);
  const setTimelineRange = useProjectStore((s) => s.setTimelineRange);

  const { labelW, isResizing, handle: labelHandle } = useLabelResize();

  const handleSelect = useCallback((id: string, additive: boolean): void => {
    if (additive) {
      const next = new Set(selectedIds);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      onSelectChange(next);
    } else {
      if (selectedIds.size === 1 && selectedIds.has(id)) return;
      onSelectChange(new Set([id]));
    }
  }, [selectedIds, onSelectChange]);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const sortedTasks   = [...tasks].sort((a, b) => a.order - b.order);

  // Étend les bornes manuelles si une tâche dépasse la plage stockée
  useEffect(() => {
    if (!activeProject) return;
    const expansion = computeRequiredBoundsExpansion(
      tasks,
      activeProject.timelineStart,
      activeProject.timelineEnd,
    );
    if (expansion) {
      setTimelineRange(activeProject.id, expansion.timelineStart, expansion.timelineEnd);
    }
  }, [tasks, activeProject?.timelineStart, activeProject?.timelineEnd, activeProject?.id, setTimelineRange]);

  const config = useMemo<TimelineConfig>(() => {
    const { totalDays: minDays } = ZOOM_CONFIGS[zoom];
    const { startDate, totalDays } = resolveTimelineBounds(
      tasks,
      activeProject?.timelineStart ?? null,
      activeProject?.timelineEnd   ?? null,
      minDays,
    );
    return { startDate, totalDays, dayWidth };
  }, [zoom, dayWidth, tasks, activeProject]);

  const totalW = labelW + config.totalDays * config.dayWidth;

  // Drag-create : tirer sur la grille vide pour créer une barre.
  const { preview, onMouseDown, result, clearResult } =
    useDragCreate(config, scrollRef, labelW);

  useEffect(() => {
    if (!result) return;
    onDragCreate(result.startDate, result.endDate);
    clearResult();
  }, [result, onDragCreate, clearResult]);

  // Move / resize / tri vertical des barres existantes via dnd-kit.
  const {
    sensors,
    onDragStart,
    onDragMove,
    onDragEnd:          taskDragEnd,
    isGroupDragging,
    isVerticalDragging,
    verticalTargetIndex,
    popVerticalReorder,
  } = useTaskDrag(config, selectedIds, scrollRef, labelW);

  // Gère la fin d'un drag : tri vertical barre OU tri grip poignée OU nettoyage.
  const handleDragEnd = useCallback((event: DragEndEvent): void => {
    taskDragEnd(); // commit le pendingReorder interne + push historique horizontal
    const vertReorder = popVerticalReorder();

    if (vertReorder) {
      const oldIndex = sortedTasks.findIndex((t) => t.id === vertReorder.taskId);
      if (oldIndex !== -1) {
        reorderTasks(arrayMove(sortedTasks, oldIndex, vertReorder.targetIndex).map((t) => t.id));
      }
      return;
    }

    // Tri via poignée (active.id = UUID nu, dans SortableContext)
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedTasks.findIndex((t) => t.id === String(active.id));
    const newIndex  = sortedTasks.findIndex((t) => t.id === String(over.id));
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTasks(arrayMove(sortedTasks, oldIndex, newIndex).map((t) => t.id));
    }
  }, [taskDragEnd, popVerticalReorder, sortedTasks, reorderTasks]);

  const gridRows = Math.max(sortedTasks.length, 3);

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto select-none" style={{ minWidth: 0 }}>
      <div ref={chartRef} style={{ width: totalW }}>

        {/* Header — collé en haut lors du scroll vertical */}
        <div
          className="sticky top-0 z-20 flex bg-[#F8F7F4] dark:bg-neutral-800 border-b-2 border-[#E8E6E1] dark:border-neutral-700"
          style={{ height: HEADER_H }}
        >
          <div
            className="sticky left-0 z-30 flex-none flex items-center px-4 bg-[#F8F7F4] dark:bg-neutral-800 border-r border-[#E8E6E1] dark:border-neutral-700 text-sm font-semibold text-neutral-900 dark:text-neutral-100 relative"
            style={{ width: labelW }}
          >
            <span className="truncate">{activeProject?.name ?? 'Gantt'}</span>
            <div
              aria-hidden
              {...labelHandle}
              className={[
                'absolute inset-y-0 -right-1 w-2 cursor-col-resize z-10 group/resize',
              ].join(' ')}
            >
              <div className={[
                'absolute inset-y-0 left-1/2 w-px -translate-x-px transition-colors',
                isResizing ? 'bg-emerald-500' : 'bg-transparent group-hover/resize:bg-emerald-400',
              ].join(' ')} />
            </div>
          </div>
          <GanttHeader config={config} zoom={zoom} onDayWidthChange={onDayWidthChange} />
        </div>

        {/* Corps — drag-create + move/resize + tri vertical via DndContext */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={handleDragEnd}
          autoScroll={false}
        >
          <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div
              className="relative cursor-crosshair"
              style={{ minHeight: gridRows * ROW_H }}
              onMouseDown={onMouseDown}
              onClick={() => onSelectChange(new Set())}
            >
              <GanttGrid config={config} zoom={zoom} rowCount={gridRows} labelW={labelW} />

              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    config={config}
                    labelW={labelW}
                    labelHandle={labelHandle}
                    isResizing={isResizing}
                    onEdit={onEditTask}
                    isSelected={selectedIds.has(task.id)}
                    isInGroupDrag={isGroupDragging && selectedIds.has(task.id)}
                    onSelect={handleSelect}
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
                  style={{ left: labelW + preview.x, width: preview.width, height: '100%' }}
                />
              )}

              {/* Indicateur de dépôt — drag vertical d'une barre */}
              {isVerticalDragging && verticalTargetIndex !== null && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-[#4a7c6a] z-30 pointer-events-none"
                  style={{ top: verticalTargetIndex * ROW_H }}
                />
              )}
            </div>
          </SortableContext>
        </DndContext>

      </div>
    </div>
  );
});

export default GanttChart;
