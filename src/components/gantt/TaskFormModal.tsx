import { useState } from 'react';
import type { TaskStatus } from '../../types/index';
import type { TaskInput } from '../../store/taskStore';
import { useTaskStore } from '../../store/taskStore';
import Modal from '../ui/Modal';

const INPUT_CLS =
  'w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50';

const LABEL_CLS = 'block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1';

interface Props {
  /** null = création, string = édition */
  taskId: string | null;
  /** Dates pré-remplies lors d'un drag-create (ignorées en mode édition). */
  initialStartDate?: string;
  initialEndDate?: string;
  onClose: () => void;
}

export default function TaskFormModal({ taskId, initialStartDate, initialEndDate, onClose }: Props) {
  const addTask    = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const editing    = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));

  const isEdit = taskId !== null;

  const [name,      setName]      = useState(editing?.name ?? '');
  const [startDate, setStartDate] = useState(editing?.startDate ?? initialStartDate ?? '');
  const [endDate,   setEndDate]   = useState(editing?.endDate   ?? initialEndDate   ?? '');
  const [status,    setStatus]    = useState<TaskStatus>(editing?.status ?? 'not_started');
  const [error,     setError]     = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!name.trim()) { setError('Le nom est requis.'); return; }
    if (startDate && endDate && endDate < startDate) {
      setError('La date de fin doit être égale ou postérieure à la date de début.');
      return;
    }
    const input: TaskInput = {
      name: name.trim(),
      startDate: startDate || null,
      endDate:   endDate   || null,
      status,
    };
    if (isEdit && taskId) {
      updateTask(taskId, input);
    } else {
      addTask(input);
    }
    onClose();
  }

  function handleDelete(): void {
    if (!taskId) return;
    deleteTask(taskId);
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
        {isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        {/* Nom */}
        <div className="mb-4">
          <label className={LABEL_CLS}>Nom</label>
          <input
            type="text"
            className={INPUT_CLS}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Nom de la tâche"
            autoFocus
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={LABEL_CLS}>Début</label>
            <input
              type="date"
              className={INPUT_CLS}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setError(''); }}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Fin</label>
            <input
              type="date"
              className={INPUT_CLS}
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setError(''); }}
            />
          </div>
        </div>

        {/* Statut */}
        <div className="mb-5">
          <label className={LABEL_CLS}>Statut</label>
          <select
            className={INPUT_CLS}
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            <option value="not_started">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
          </select>
        </div>

        {/* Message d'erreur */}
        {error && (
          <p className="text-xs text-red-500 mb-4">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Suppression (mode édition) */}
          {isEdit && !confirmDel && (
            <button
              type="button"
              className="text-sm text-red-500 hover:text-red-600 transition-colors mr-auto"
              onClick={() => setConfirmDel(true)}
            >
              Supprimer
            </button>
          )}
          {isEdit && confirmDel && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-neutral-500">Confirmer ?</span>
              <button
                type="button"
                className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                onClick={handleDelete}
              >
                Oui
              </button>
              <button
                type="button"
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                onClick={() => setConfirmDel(false)}
              >
                Non
              </button>
            </div>
          )}

          <button
            type="button"
            className="ml-auto px-4 py-2 text-sm rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
          >
            {isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
