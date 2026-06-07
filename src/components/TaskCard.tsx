import {
  PencilSimple,
  Trash,
  ArrowRight,
  ArrowLeft,
  CalendarBlank,
  Tag,
  DotsSixVertical,
} from '@phosphor-icons/react';
import type { Task } from '../types';

interface TaskDragProps {
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLElement>) => void;
  'aria-roledescription'?: string;
  'aria-label'?: string;
  tabIndex?: number;
  style?: { opacity: number; cursor: string };
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  isAdmin?: boolean;
  isDragging?: boolean;
  dragProps?: TaskDragProps;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  touchDragProps?: {
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLElement>) => void;
    onTouchEnd: (e: React.TouchEvent<HTMLElement>) => void;
  };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T23:59:59') < new Date();
}

const statusTransitions: Record<string, { prev?: string; next?: string }> = {
  todo: { next: 'in_progress' },
  in_progress: { prev: 'todo', next: 'done' },
  done: { prev: 'in_progress' },
};

const statusLabels: Record<string, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  done: 'Concluída',
};

export function TaskCard({
  task,
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  isAdmin = false,
  isDragging = false,
  dragProps,
  onKeyDown,
  touchDragProps,
}: TaskCardProps) {
  const transitions = statusTransitions[task.status];
  const overdue = task.status !== 'done' && isOverdue(task.due_date);

  return (
    <div
      draggable={isAdmin && dragProps?.draggable}
      onDragStart={(e) => {
        // Don't start drag if clicking on buttons
        const target = e.target as HTMLElement;
        if (target.closest('button')) {
          e.preventDefault();
          return;
        }
        dragProps?.onDragStart?.(e);
      }}
      onDragEnd={dragProps?.onDragEnd}
      className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group ${isDragging ? 'opacity-50' : ''} ${isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      onClick={onClick}
      {...(touchDragProps || {})}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-1.5">
          {isAdmin && (
            <div
              onKeyDown={onKeyDown}
              aria-roledescription={dragProps?.['aria-roledescription']}
              aria-label={dragProps?.['aria-label']}
              tabIndex={dragProps?.tabIndex ?? -1}
              className="flex-shrink-0 mt-0.5 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
              role="button"
              title="Arrastar tarefa"
            >
              <DotsSixVertical size={16} weight="bold" />
            </div>
          )}
          <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
            {task.title}
          </h3>
        </div>
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0"
          style={{
            backgroundColor: task.priority_color + '18',
            color: task.priority_color,
          }}
        >
          {task.priority_name}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: task.category_color + '18',
            color: task.category_color,
          }}
        >
          <Tag size={12} weight="bold" className="mr-1" />
          {task.category_name}
        </span>
        {task.due_date && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${overdue ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <CalendarBlank size={12} weight="bold" className="mr-1" />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {isAdmin ? (
        <div
          className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {transitions.prev && (
            <button
              onClick={() => onStatusChange(transitions.prev!)}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Voltar status"
              aria-label={`Mover para ${statusLabels[transitions.prev!] || transitions.prev}`}
            >
              <ArrowLeft size={14} weight="bold" />
            </button>
          )}
          {transitions.next && (
            <button
              onClick={() => onStatusChange(transitions.next!)}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Avançar status"
              aria-label={`Mover para ${statusLabels[transitions.next!] || transitions.next}`}
            >
              <ArrowRight size={14} weight="bold" />
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            title="Editar"
            aria-label="Editar tarefa"
          >
            <PencilSimple size={14} weight="bold" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            title="Excluir"
            aria-label="Excluir tarefa"
          >
            <Trash size={14} weight="bold" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed">
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
            Apenas administrador
          </span>
        </div>
      )}
    </div>
  );
}
