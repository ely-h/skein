import { useProjectStore } from '../../store/projectStore';
import { useTaskStore } from '../../store/taskStore';
import type { TimelineConfig } from '../../lib/timeline';
import { DAY_W, LABEL_W, TOTAL_DAYS, HEADER_WEEK_H, HEADER_DAY_H } from './constants';
import GanttHeader from './GanttHeader';
import GanttGrid from './GanttGrid';
import TaskRow from './TaskRow';

const CHART_CONFIG: TimelineConfig = {
  startDate: '2025-06-02',
  totalDays: TOTAL_DAYS,
  dayWidth: DAY_W,
};

const HEADER_H = HEADER_WEEK_H + HEADER_DAY_H;
const TOTAL_W = LABEL_W + TOTAL_DAYS * DAY_W;

export default function GanttChart() {
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 overflow-auto" style={{ minWidth: 0 }}>
      <div style={{ width: TOTAL_W }}>

        {/* Header — collé en haut lors du scroll vertical */}
        <div
          className="sticky top-0 z-20 flex bg-white dark:bg-neutral-950 border-b-2 border-neutral-200 dark:border-neutral-800"
          style={{ height: HEADER_H }}
        >
          {/* Coin fixe — collé en haut ET à gauche */}
          <div
            className="sticky left-0 z-30 flex-none flex items-center px-4 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
            style={{ width: LABEL_W }}
          >
            <span className="truncate">{activeProject?.name ?? 'Gantt'}</span>
          </div>
          <GanttHeader config={CHART_CONFIG} />
        </div>

        {/* Corps */}
        <div className="relative">
          <GanttGrid config={CHART_CONFIG} rowCount={sortedTasks.length} />

          {sortedTasks.length > 0 ? (
            sortedTasks.map((task) => (
              <TaskRow key={task.id} task={task} config={CHART_CONFIG} />
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-neutral-400">
              Aucune tâche planifiée
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
