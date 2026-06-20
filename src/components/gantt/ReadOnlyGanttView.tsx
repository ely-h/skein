import { useRef, useMemo } from 'react';
import type { Project, Task } from '../../types/index';
import type { TimelineConfig } from '../../lib/timeline';
import { resolveTimelineBounds, taskToBar } from '../../lib/timeline';
import { LABEL_W, HEADER_WEEK_H, HEADER_DAY_H, ROW_H, ZOOM_CONFIGS } from './constants';
import GanttHeader from './GanttHeader';
import GanttGrid from './GanttGrid';
import { useThemeStore } from '../../store/themeStore';
import { contrastColor } from '../../lib/color';

const HEADER_H = HEADER_WEEK_H + HEADER_DAY_H;

const MIN_BAR_LABEL_W = 48;

function ReadOnlyBar({ task, config }: {
  task: Task & { startDate: string; endDate: string };
  config: TimelineConfig;
}) {
  const statusColors = useThemeStore((s) => s.statusColors);
  const bgColor      = statusColors[task.status];
  const textColor    = contrastColor(bgColor);
  const { x, width } = taskToBar(task, config);
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 h-7 rounded-md overflow-hidden"
      style={{ left: x, width, backgroundColor: bgColor }}
      title={task.name}
    >
      {width >= MIN_BAR_LABEL_W && (
        <span
          className="absolute inset-x-3 inset-y-0 flex items-center text-[11px] font-medium truncate pointer-events-none select-none"
          style={{ color: textColor }}
        >
          {task.name}
        </span>
      )}
    </div>
  );
}

interface Props {
  project: Project;
}

export default function ReadOnlyGanttView({ project }: Props) {
  const scrollRef    = useRef<HTMLDivElement>(null);
  const statusColors = useThemeStore((s) => s.statusColors);

  const sortedTasks = [...project.tasks].sort((a, b) => a.order - b.order);

  const config = useMemo<TimelineConfig>(() => {
    const { totalDays: minDays, dayWidth } = ZOOM_CONFIGS['day'];
    const { startDate, totalDays } = resolveTimelineBounds(
      project.tasks,
      project.timelineStart,
      project.timelineEnd,
      minDays,
    );
    return { startDate, totalDays, dayWidth };
  }, [project]);

  const totalW    = LABEL_W + config.totalDays * config.dayWidth;
  const gridRows  = Math.max(sortedTasks.length, 3);

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto select-none" style={{ minWidth: 0 }}>
      <div style={{ width: totalW }}>

        {/* Header */}
        <div
          className="sticky top-0 z-20 flex bg-[var(--bg-base)] dark:bg-[var(--bg-base)] border-b-2 border-[var(--border)] dark:border-[var(--border)]"
          style={{ height: HEADER_H }}
        >
          <div
            className="sticky left-0 z-30 flex-none flex items-center px-4 bg-[var(--bg-base)] dark:bg-[var(--bg-base)] border-r border-[var(--border)] dark:border-[var(--border)] text-sm font-semibold text-neutral-900 dark:text-neutral-100"
            style={{ width: LABEL_W }}
          >
            <span className="truncate">{project.name}</span>
          </div>
          <GanttHeader config={config} zoom="day" />
        </div>

        {/* Corps */}
        <div className="relative" style={{ minHeight: gridRows * ROW_H }}>
          <GanttGrid config={config} zoom="day" rowCount={gridRows} />

          {sortedTasks.length > 0 ? sortedTasks.map((task) => (
            <div
              key={task.id}
              className="flex border-b border-[#EDEBE5] dark:border-[var(--border)]/60"
              style={{ height: ROW_H }}
            >
              <div
                className="sticky left-0 z-10 flex-none flex items-center gap-2 px-4 bg-[var(--bg-base)] dark:bg-[var(--bg-base)] border-r border-[var(--border)] dark:border-[var(--border)]"
                style={{ width: LABEL_W }}
              >
                <div
                  className="flex-none w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: statusColors[task.status] }}
                />
                <span className="truncate text-sm text-neutral-700 dark:text-neutral-300">
                  {task.name}
                </span>
              </div>

              <div
                className="relative flex-none"
                style={{ width: config.totalDays * config.dayWidth }}
              >
                {task.startDate && task.endDate && (
                  <ReadOnlyBar
                    task={task as Task & { startDate: string; endDate: string }}
                    config={config}
                  />
                )}
              </div>
            </div>
          )) : (
            <div className="flex items-center justify-center h-32 text-sm text-neutral-400">
              Aucune tâche planifiée
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
