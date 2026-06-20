import { useState } from 'react';
import type { TaskStatus, CustomStatus } from '../../types/index';
import type { TaskInput } from '../../store/taskStore';
import { useTaskStore } from '../../store/taskStore';
import { useThemeStore } from '../../store/themeStore';
import Modal from '../ui/Modal';

const INPUT_CLS =
  'w-full rounded-md border border-[var(--border)] dark:border-[var(--border)] bg-[var(--bg-base)] dark:bg-neutral-900 px-3 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50';

const LABEL_CLS = 'block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1';

interface Props {
  taskId: string | null;
  initialStartDate?: string;
  initialEndDate?: string;
  onClose: () => void;
}

export default function TaskFormModal({ taskId, initialStartDate, initialEndDate, onClose }: Props) {
  const addTask    = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const editing    = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));

  const addCustomStatus    = useThemeStore((s) => s.addCustomStatus);
  const customStatuses     = useThemeStore((s) => s.customStatuses);

  const isEdit = taskId !== null;

  const [name,       setName]       = useState(editing?.name ?? '');
  const [startDate,  setStartDate]  = useState(editing?.startDate ?? initialStartDate ?? '');
  const [endDate,    setEndDate]    = useState(editing?.endDate   ?? initialEndDate   ?? '');
  const [status,     setStatus]     = useState<TaskStatus>(editing?.status ?? 'not_started');
  const [customLabel, setCustomLabel] = useState(editing?.customStatus?.label ?? '');
  const [customColor, setCustomColor] = useState(editing?.customStatus?.color ?? '#a78bfa');
  const [error,      setError]      = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  function handleStatusChange(val: string): void {
    if (val === 'custom') {
      setStatus('custom');
      return;
    }
    // Preset custom sélectionné depuis la liste
    if (val.startsWith('preset:')) {
      const label = val.slice(7);
      const preset = customStatuses.find((cs) => cs.label === label);
      if (preset) {
        setStatus('custom');
        setCustomLabel(preset.label);
        setCustomColor(preset.color);
      }
      return;
    }
    setStatus(val as TaskStatus);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!name.trim()) { setError('Le nom est requis.'); return; }
    if (startDate && endDate && endDate < startDate) {
      setError('La date de fin doit être égale ou postérieure à la date de début.');
      return;
    }
    if (status === 'custom' && !customLabel.trim()) {
      setError('Le libellé du statut personnalisé est requis.');
      return;
    }

    const resolvedCustom: CustomStatus | undefined =
      status === 'custom' ? { label: customLabel.trim(), color: customColor } : undefined;

    if (resolvedCustom) {
      addCustomStatus(resolvedCustom);
    }

    const input: TaskInput = {
      name: name.trim(),
      startDate: startDate || null,
      endDate:   endDate   || null,
      status,
      customStatus: resolvedCustom,
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
        <div className="mb-4">
          <label className={LABEL_CLS}>Statut</label>
          <select
            className={INPUT_CLS}
            value={status === 'custom' ? (customStatuses.some((cs) => cs.label === customLabel) ? `preset:${customLabel}` : 'custom') : status}
            onChange={(e) => { handleStatusChange(e.target.value); setError(''); }}
          >
            <option value="backlog">Backlog</option>
            <option value="not_started">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="in_review">En validation</option>
            <option value="blocked">Bloqué</option>
            <option value="done">Terminé</option>
            {customStatuses.length > 0 && (
              <optgroup label="Personnalisés">
                {customStatuses.map((cs) => (
                  <option key={cs.label} value={`preset:${cs.label}`}>
                    {cs.label}
                  </option>
                ))}
              </optgroup>
            )}
            <option value="custom">Personnalisé…</option>
          </select>
        </div>

        {/* Champs custom si status === 'custom' */}
        {status === 'custom' && (
          <div className="flex gap-3 mb-4 items-end">
            <div className="flex-1">
              <label className={LABEL_CLS}>Libellé</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={customLabel}
                onChange={(e) => { setCustomLabel(e.target.value); setError(''); }}
                placeholder="Ex : En attente"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Couleur</label>
              <div
                className="w-9 h-9 rounded-md border-2 border-[var(--border)] dark:border-[var(--border)] overflow-hidden relative"
                style={{ backgroundColor: customColor }}
              >
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <p className="text-xs text-red-500 mb-4">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
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
            className="ml-auto px-4 py-2 text-sm rounded-xl bg-[var(--bg-hover)] dark:bg-[var(--bg-base)] hover:bg-[#E8E6E1] dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
          >
            {isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
