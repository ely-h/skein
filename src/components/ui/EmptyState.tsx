import { useProjectStore } from '../../store/projectStore';

export default function EmptyState() {
  const addProject = useProjectStore((s) => s.addProject);

  function handleCreate(): void {
    const name = prompt('Nom du projet :');
    if (name?.trim()) addProject(name.trim());
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-[#F8F7F4] dark:bg-neutral-800">
      <img src="/logo.png" alt="Skein" className="w-16 h-16 opacity-80" />
      <div className="text-center">
        <p className="text-base font-semibold text-neutral-700 dark:text-neutral-200">
          Aucun projet pour l'instant
        </p>
        <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
          Crée ton premier projet pour commencer.
        </p>
      </div>
      <button
        type="button"
        onClick={handleCreate}
        className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
      >
        Créer un projet
      </button>
    </div>
  );
}
