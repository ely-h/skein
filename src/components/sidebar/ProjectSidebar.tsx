import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useSidebarResize } from '../../hooks/useSidebarResize';

export default function ProjectSidebar() {
  const projects         = useProjectStore((s) => s.projects);
  const activeProjectId  = useProjectStore((s) => s.activeProjectId);
  const addProject       = useProjectStore((s) => s.addProject);
  const renameProject    = useProjectStore((s) => s.renameProject);
  const deleteProject    = useProjectStore((s) => s.deleteProject);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  const [renamingId,  setRenamingId]  = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [addingNew,   setAddingNew]   = useState(false);
  const [newName,     setNewName]     = useState('');

  const renameRef = useRef<HTMLInputElement>(null);
  const newRef    = useRef<HTMLInputElement>(null);

  const { width, isResizing, handle } = useSidebarResize();

  useEffect(() => { if (renamingId) renameRef.current?.focus(); }, [renamingId]);
  useEffect(() => { if (addingNew)  newRef.current?.focus();    }, [addingNew]);

  function startRename(id: string, name: string): void {
    setDeletingId(null);
    setRenamingId(id);
    setRenameValue(name);
  }

  function commitRename(): void {
    if (renamingId && renameValue.trim()) renameProject(renamingId, renameValue.trim());
    setRenamingId(null);
  }

  function commitNew(): void {
    if (newName.trim()) addProject(newName.trim());
    setNewName('');
    setAddingNew(false);
  }

  return (
    <aside
      className="flex-none flex flex-col relative border-r border-neutral-200 dark:border-neutral-700 bg-[#F8F7F4] dark:bg-neutral-900"
      style={{ width }}
    >

      {/* En-tête sidebar */}
      <div className="flex-none px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Projets
        </span>
      </div>

      {/* Liste des projets */}
      <ul className="flex-1 overflow-y-auto py-1">
        {projects.map((project) => {
          const isActive   = project.id === activeProjectId;
          const isRenaming = project.id === renamingId;
          const isDeleting = project.id === deletingId;

          return (
            <li key={project.id} className="group px-2 py-0.5">

              {isRenaming ? (
                <input
                  ref={renameRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-full px-2 py-1.5 text-sm rounded-md bg-[#F8F7F4] dark:bg-neutral-800 border border-emerald-500 outline-none text-neutral-900 dark:text-neutral-100"
                />
              ) : isDeleting ? (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-red-50 dark:bg-red-950/20">
                  <span className="flex-1 text-xs text-neutral-500 dark:text-neutral-400 truncate">Supprimer ?</span>
                  <button
                    type="button"
                    onClick={() => { deleteProject(project.id); setDeletingId(null); }}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(null)}
                    className="text-xs font-medium text-neutral-400 hover:text-neutral-600"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveProject(project.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveProject(project.id); }}
                  className={[
                    'flex items-center gap-1 px-2 py-1.5 rounded-xl cursor-pointer transition-colors',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50',
                  ].join(' ')}
                >
                  <span className="flex-1 truncate text-sm">{project.name}</span>

                  {/* Bouton renommer */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startRename(project.id, project.name); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    title="Renommer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  {/* Bouton supprimer */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDeletingId(project.id); setRenamingId(null); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500"
                    title="Supprimer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              )}

            </li>
          );
        })}
      </ul>

      {/* Bouton / formulaire nouveau projet */}
      <div className="flex-none border-t border-neutral-200 dark:border-neutral-700 p-2">
        {addingNew ? (
          <input
            ref={newRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => { if (!newName.trim()) { setAddingNew(false); setNewName(''); } }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNew();
              if (e.key === 'Escape') { setAddingNew(false); setNewName(''); }
            }}
            placeholder="Nom du projet"
            className="w-full px-2 py-1.5 text-sm rounded-md bg-[#F8F7F4] dark:bg-neutral-800 border border-emerald-500 outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded-xl transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nouveau projet
          </button>
        )}
      </div>

      {/* Handle de resize — pointer capture, ne remonte pas aux sensors dnd-kit */}
      <div
        aria-hidden
        {...handle}
        className={[
          'absolute inset-y-0 right-0 w-1.5 cursor-col-resize z-10 transition-colors',
          isResizing ? 'bg-emerald-500/50' : 'hover:bg-emerald-400/40',
        ].join(' ')}
      />

    </aside>
  );
}
