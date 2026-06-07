import { useState, useCallback } from 'react';
import type { TaskStatus } from './useDragAndDrop';

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

const COLUMN_NAMES: Record<TaskStatus, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  done: 'Concluída',
};

interface UseKeyboardDragOptions {
  isAdmin: boolean;
  onMove: (taskId: number, targetColumn: TaskStatus) => void;
  onAnnounce: (message: string) => void;
}

interface KeyboardDragState {
  isActive: boolean;
  taskId: number | null;
  taskTitle: string;
  sourceColumn: TaskStatus | null;
  currentTargetIndex: number;
}

export function useKeyboardDrag({
  isAdmin,
  onMove,
  onAnnounce,
}: UseKeyboardDragOptions) {
  const [kbDragState, setKbDragState] = useState<KeyboardDragState>({
    isActive: false,
    taskId: null,
    taskTitle: '',
    sourceColumn: null,
    currentTargetIndex: 0,
  });

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLElement>,
      taskId: number,
      taskTitle: string,
      sourceColumn: TaskStatus,
    ) => {
      if (!isAdmin) return;

      if (!kbDragState.isActive) {
        // Start drag with Enter or Space
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const sourceIndex = COLUMNS.indexOf(sourceColumn);
          setKbDragState({
            isActive: true,
            taskId,
            taskTitle,
            sourceColumn,
            currentTargetIndex: sourceIndex,
          });
          onAnnounce(
            `Modo arrastar ativado para "${taskTitle}". Use setas esquerda e direita para navegar entre colunas. Enter para confirmar, Escape para cancelar.`,
          );
        }
      } else if (kbDragState.taskId === taskId) {
        // Already in drag mode
        switch (e.key) {
          case 'ArrowLeft': {
            e.preventDefault();
            const newIndex = Math.max(0, kbDragState.currentTargetIndex - 1);
            setKbDragState((prev) => ({
              ...prev,
              currentTargetIndex: newIndex,
            }));
            onAnnounce(
              `Coluna ${COLUMN_NAMES[COLUMNS[newIndex]]} selecionada.`,
            );
            break;
          }
          case 'ArrowRight': {
            e.preventDefault();
            const newIndex = Math.min(
              COLUMNS.length - 1,
              kbDragState.currentTargetIndex + 1,
            );
            setKbDragState((prev) => ({
              ...prev,
              currentTargetIndex: newIndex,
            }));
            onAnnounce(
              `Coluna ${COLUMN_NAMES[COLUMNS[newIndex]]} selecionada.`,
            );
            break;
          }
          case 'Enter': {
            e.preventDefault();
            const targetColumn = COLUMNS[kbDragState.currentTargetIndex];
            if (targetColumn !== kbDragState.sourceColumn) {
              onMove(taskId, targetColumn);
              onAnnounce(
                `Tarefa "${kbDragState.taskTitle}" movida para ${COLUMN_NAMES[targetColumn]}.`,
              );
            } else {
              onAnnounce(
                'Operação cancelada. Tarefa permanece na mesma coluna.',
              );
            }
            setKbDragState({
              isActive: false,
              taskId: null,
              taskTitle: '',
              sourceColumn: null,
              currentTargetIndex: 0,
            });
            break;
          }
          case 'Escape': {
            e.preventDefault();
            setKbDragState({
              isActive: false,
              taskId: null,
              taskTitle: '',
              sourceColumn: null,
              currentTargetIndex: 0,
            });
            onAnnounce('Operação de arrastar cancelada.');
            break;
          }
        }
      }
    },
    [isAdmin, kbDragState, onMove, onAnnounce],
  );

  return {
    kbDragState,
    handleKeyDown,
  };
}
