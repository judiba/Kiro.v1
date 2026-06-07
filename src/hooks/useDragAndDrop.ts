import { useState, useCallback, useRef, useEffect } from 'react';
import type { Task } from '../types';
import { api } from '../api';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface DragState {
  isDragging: boolean;
  draggedTaskId: number | null;
  sourceColumn: TaskStatus | null;
  targetColumn: TaskStatus | null;
  dragCancelled: boolean;
}

export interface TaskDragProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLElement>) => void;
  'aria-roledescription': string;
  'aria-label': string;
  tabIndex: number;
  style: { opacity: number; cursor: string };
}

export interface ColumnDropProps {
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
  isHighlighted: boolean;
}

interface TaskSnapshot {
  taskId: number;
  originalStatus: TaskStatus;
  originalIndex: number;
}

interface UseDragAndDropOptions {
  tasks: Task[];
  isAdmin: boolean;
  onTasksUpdate: (tasks: Task[]) => void;
}

interface UseDragAndDropReturn {
  dragState: DragState;
  getTaskDragProps: (task: Task) => TaskDragProps;
  getColumnDropProps: (columnId: TaskStatus) => ColumnDropProps;
  ariaAnnouncement: string;
  error: string | null;
  dismissError: () => void;
}

const COLUMN_NAMES: Record<TaskStatus, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  done: 'Concluída',
};

const initialDragState: DragState = {
  isDragging: false,
  draggedTaskId: null,
  sourceColumn: null,
  targetColumn: null,
  dragCancelled: false,
};

export function useDragAndDrop({
  tasks,
  isAdmin,
  onTasksUpdate,
}: UseDragAndDropOptions): UseDragAndDropReturn {
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');
  const [error, setError] = useState<string | null>(null);

  const snapshotRef = useRef<TaskSnapshot | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      errorTimerRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => {
        if (errorTimerRef.current) {
          clearTimeout(errorTimerRef.current);
        }
      };
    }
  }, [error]);

  const dismissError = useCallback(() => {
    setError(null);
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragState.isDragging) {
        e.preventDefault();
        setDragState({
          ...initialDragState,
          dragCancelled: true,
        });
        setAriaAnnouncement('Operação de arrastar cancelada.');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dragState.isDragging]);

  const performDrop = useCallback(
    async (taskId: number, targetColumn: TaskStatus) => {
      const snapshot = snapshotRef.current;
      if (!snapshot || snapshot.originalStatus === targetColumn) {
        setDragState(initialDragState);
        return;
      }

      // Optimistic update: move card to end of target column
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, status: targetColumn } : t,
      );
      onTasksUpdate(updatedTasks);

      setAriaAnnouncement(`Tarefa movida para ${COLUMN_NAMES[targetColumn]}.`);

      // PATCH API call with timeout
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        await updateStatusWithTimeout(taskId, targetColumn, controller.signal);
      } catch (err) {
        // Rollback
        const rollbackTasks = tasks.map((t) =>
          t.id === snapshot.taskId
            ? { ...t, status: snapshot.originalStatus }
            : t,
        );
        onTasksUpdate(rollbackTasks);
        setError('Falha ao atualizar status da tarefa. Tente novamente.');
        setAriaAnnouncement(
          'Falha ao mover tarefa. Tarefa restaurada à posição original.',
        );
      } finally {
        clearTimeout(timeoutId);
        abortControllerRef.current = null;
      }

      setDragState(initialDragState);
      snapshotRef.current = null;
    },
    [tasks, onTasksUpdate],
  );

  const getTaskDragProps = useCallback(
    (task: Task): TaskDragProps => {
      const isDragging = dragState.draggedTaskId === task.id;

      return {
        draggable: isAdmin,
        onDragStart: (e: React.DragEvent<HTMLElement>) => {
          if (!isAdmin) {
            e.preventDefault();
            return;
          }
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(task.id));

          const columnTasks = tasks.filter((t) => t.status === task.status);
          const originalIndex = columnTasks.findIndex((t) => t.id === task.id);

          snapshotRef.current = {
            taskId: task.id,
            originalStatus: task.status as TaskStatus,
            originalIndex,
          };

          setDragState({
            isDragging: true,
            draggedTaskId: task.id,
            sourceColumn: task.status as TaskStatus,
            targetColumn: null,
            dragCancelled: false,
          });

          setAriaAnnouncement(
            `Arrastando tarefa "${task.title}" da coluna ${COLUMN_NAMES[task.status as TaskStatus]}.`,
          );
        },
        onDragEnd: (e: React.DragEvent<HTMLElement>) => {
          // If drop was not handled (outside valid columns), cancel
          if (dragState.isDragging && !dragState.dragCancelled) {
            if (e.dataTransfer.dropEffect === 'none') {
              setAriaAnnouncement('Operação de arrastar cancelada.');
            }
          }
          setDragState(initialDragState);
          snapshotRef.current = null;
        },
        'aria-roledescription': 'arrastar tarefa',
        'aria-label': task.title,
        tabIndex: isAdmin ? 0 : -1,
        style: {
          opacity: isDragging ? 0.5 : 1,
          cursor: isAdmin ? 'grab' : 'default',
        },
      };
    },
    [isAdmin, dragState, tasks],
  );

  const getColumnDropProps = useCallback(
    (columnId: TaskStatus): ColumnDropProps => {
      const isHighlighted =
        dragState.isDragging &&
        dragState.targetColumn === columnId &&
        dragState.sourceColumn !== columnId;

      return {
        onDragOver: (e: React.DragEvent<HTMLElement>) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        },
        onDragEnter: (e: React.DragEvent<HTMLElement>) => {
          e.preventDefault();
          setDragState((prev) => {
            if (!prev.isDragging) return prev;
            return { ...prev, targetColumn: columnId };
          });

          if (columnId !== dragState.sourceColumn && dragState.isDragging) {
            const task = tasks.find((t) => t.id === dragState.draggedTaskId);
            if (task) {
              setAriaAnnouncement(
                `Tarefa "${task.title}" sobre a coluna ${COLUMN_NAMES[columnId]}.`,
              );
            }
          }
        },
        onDragLeave: (e: React.DragEvent<HTMLElement>) => {
          // Only clear if leaving the column itself (not a child)
          const relatedTarget = e.relatedTarget as HTMLElement | null;
          if (
            relatedTarget &&
            (e.currentTarget as HTMLElement).contains(relatedTarget)
          ) {
            return;
          }
          setDragState((prev) => ({
            ...prev,
            targetColumn:
              prev.targetColumn === columnId ? null : prev.targetColumn,
          }));
        },
        onDrop: (e: React.DragEvent<HTMLElement>) => {
          e.preventDefault();
          const taskIdStr = e.dataTransfer.getData('text/plain');
          const taskId = taskIdStr
            ? Number(taskIdStr)
            : dragState.draggedTaskId;

          if (!taskId) {
            setDragState(initialDragState);
            snapshotRef.current = null;
            return;
          }

          const task = tasks.find((t) => t.id === taskId);
          if (!task || task.status === columnId) {
            // Drop on same column - cancel
            setDragState(initialDragState);
            snapshotRef.current = null;
            return;
          }

          // If snapshot wasn't set yet (timing), create it now
          if (!snapshotRef.current) {
            const columnTasks = tasks.filter((t) => t.status === task.status);
            const originalIndex = columnTasks.findIndex((t) => t.id === taskId);
            snapshotRef.current = {
              taskId: taskId,
              originalStatus: task.status as TaskStatus,
              originalIndex,
            };
          }

          performDrop(taskId, columnId);
        },
        isHighlighted,
      };
    },
    [dragState, tasks, performDrop],
  );

  return {
    dragState,
    getTaskDragProps,
    getColumnDropProps,
    ariaAnnouncement,
    error,
    dismissError,
  };
}

async function updateStatusWithTimeout(
  taskId: number,
  status: TaskStatus,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(`/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('taskflow-token') || ''}`,
    },
    body: JSON.stringify({ status }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}
