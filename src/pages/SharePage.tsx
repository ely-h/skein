import { useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { decodeShareParam } from '../lib/share';
import ReadOnlyGanttView from '../components/gantt/ReadOnlyGanttView';

export default function SharePage() {
  const importProject = useProjectStore((s) => s.importProject);
  const [imported, setImported] = useState(false);

  const encoded = new URLSearchParams(window.location.search).get('data') ?? '';

  const { project, error } = useMemo(() => {
    if (!encoded) {
      return { project: null, error: 'Aucune donnée dans le lien.' };
    }
    try {
      return { project: decodeShareParam(encoded), error: null };
    } catch (e) {
      return { project: null, error: e instanceof Error ? e.message : 'Lien invalide.' };
    }
  }, [encoded]);

  function handleImport(): void {
    if (!project || imported) return;
    importProject(project);
    setImported(true);
    // Laisse le temps au store de persister avant la navigation
    setTimeout(() => {
      window.location.href = import.meta.env.BASE_URL;
    }, 800);
  }

  return (
    <div className="h-screen flex flex-col bg-[#F8F7F4] dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">

      {/* Bandeau */}
      <header className="flex-none flex items-center justify-between gap-4 px-6 h-12 border-b border-[#E8E6E1] dark:border-neutral-700 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-base font-semibold tracking-tight flex-none">Skein</span>
          <span className="text-neutral-300 dark:text-neutral-600 flex-none" aria-hidden>·</span>
          <span className="truncate text-sm text-neutral-500 dark:text-neutral-400">
            {project ? project.name : 'Aperçu partagé'}
          </span>
          <span className="flex-none text-xs px-2 py-0.5 rounded-full bg-[#E8E6E1] dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
            Lecture seule
          </span>
        </div>

        <div className="flex items-center gap-3 flex-none">
          <a
            href={import.meta.env.BASE_URL}
            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors"
          >
            Ouvrir Skein
          </a>
          {project && (
            <button
              type="button"
              onClick={handleImport}
              disabled={imported}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {imported ? 'Importé !' : 'Importer dans Skein'}
            </button>
          )}
        </div>
      </header>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-center max-w-md">
            <p className="text-sm font-medium text-red-500 mb-2">Lien invalide</p>
            <p className="text-xs text-neutral-400">{error}</p>
          </div>
          <a
            href={import.meta.env.BASE_URL}
            className="text-sm text-[#4a7c6a] hover:underline"
          >
            Retour à Skein
          </a>
        </div>
      ) : project ? (
        <ReadOnlyGanttView project={project} />
      ) : null}

    </div>
  );
}
