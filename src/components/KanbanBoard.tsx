import { useState, useCallback } from 'react';
import { Circle, Clock, CheckCircle } from '@phosphor-icons/react';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';
import { AriaLiveRegion } from './AriaLiveRegion';
import { ErrorToast } from './ErrorToast';
import { useDragAndDrop, type TaskStatus } from '../hooks/useDragAndDrop';
import { useTouchDrag } from '../hooks/useTouchDrag';
import { useKeyboardDrag } from '../hooks/useKeyboardDrag';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onStatusChange: (taskId: number, status: string) => void;
  isAdmin: boolean;
  onTasksUpdate?: (tasks: Task[]) => void;
}

const columns = [
  {
    id: 'todo' as const,
    title: 'A Fazer',
    icon: Circle,
    iconClass: 'text-slate-400',
    headerClass: 'border-slate-300 dark:border-slate-600',
  },
  {
    id: 'in_progress' as const,
    title: 'Em Progresso',
    icon: Clock,
    iconClass: 'text-amber-500',
    headerClass: 'border-amber-400',
  },
  {
    id: 'done' as const,
    title: 'Concluída',
    icon: CheckCircle,
    iconClass: 'text-emerald-500',
    headerClass: 'border-emerald-400',
  },
];

export function KanbanBoard({
  tasks,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  isAdmin,
  onTasksUpdate,
}: KanbanBoardProps) {
  const [localAnnouncement, setLocalAnnouncement] = useState('');

  const handleTasksUpdate = useCallback(
    (updatedTasks: Task[]) => {
      if (onTasksUpdate) {
        onTasksUpdate(updatedTasks);
      }
    },
    [onTasksUpdate],
  );

  const {
    dragState,
    getTaskDragProps,
    getColumnDropProps,
    ariaAnnouncement,
    error,
    dismissError,
  } = useDragAndDrop({
    tasks,
    isAdmin,
    onTasksUpdate: handleTasksUpdate,
  });

  const handleKeyboardMove = useCallback(
    (taskId: number, targetColumn: TaskStatus) => {
      onStatusChange(taskId, targetColumn);
    },
    [onStatusChange],
  );

  const handleAnnounce = useCallback((message: string) => {
    setLocalAnnouncement(message);
  }, []);

  const { handleKeyDown: kbHandleKeyDown } = useKeyboardDrag({
    isAdmin,
    onMove: handleKeyboardMove,
    onAnnounce: handleAnnounce,
  });

  const { getTouchDragProps } = useTouchDrag({
    isAdmin,
    onDragStart: (taskId, sourceColumn) => {
      // Touch drag start is handled through the main hook's state
      handleAnnounce(`Arrastando tarefa da coluna ${sourceColumn}.`);
    },
    onDragMove: (_x, _y) => {
      // Preview position updates handled by touch hook internally
    },
    onDragEnd: (targetColumn) => {
      if (targetColumn) {
        handleAnnounce(`Tarefa solta na coluna ${targetColumn}.`);
      }
    },
    onCancel: () => {
      // Touch cancelled before long press
    },
  });

  const announcement = ariaAnnouncement || localAnnouncement;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          const Icon = col.icon;
          const dropProps = getColumnDropProps(col.id);
          const isHighlighted = dropProps.isHighlighted;

          return (
            <div
              key={col.id}
              data-column-id={col.id}
              className={`bg-slate-100/80 dark:bg-slate-800/50 rounded-2xl p-4 min-h-[500px] backdrop-blur-sm transition-all duration-100 ${
                isHighlighted
                  ? 'ring-2 ring-blue-400 bg-blue-50/30 dark:bg-blue-900/20'
                  : ''
              }`}
              onDragOver={dropProps.onDragOver}
              onDragEnter={dropProps.onDragEnter}
              onDragLeave={dropProps.onDragLeave}
              onDrop={dropProps.onDrop}
            >
              <div
                className={`flex items-center gap-2 mb-4 pb-3 border-b-2 ${col.headerClass}`}
              >
                <Icon size={20} weight="fill" className={col.iconClass} />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                  {col.title}
                </h2>
                <span className="ml-auto bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnTasks.map((task) => {
                  const taskDragProps = getTaskDragProps(task);
                  const touchProps = getTouchDragProps(task.id, col.id);

                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                      onEdit={() => onEditTask(task)}
                      onDelete={() => onDeleteTask(task.id)}
                      onStatusChange={(status) =>
                        onStatusChange(task.id, status)
                      }
                      isAdmin={isAdmin}
                      isDragging={dragState.draggedTaskId === task.id}
                      dragProps={taskDragProps}
                      onKeyDown={(e) =>
                        kbHandleKeyDown(e, task.id, task.title, col.id)
                      }
                      touchDragProps={touchProps}
                    />
                  );
                })}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                    Nenhuma tarefa aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AriaLiveRegion message={announcement} />

      {error && <ErrorToast message={error} onDismiss={dismissError} />}
    </>
  );
}
