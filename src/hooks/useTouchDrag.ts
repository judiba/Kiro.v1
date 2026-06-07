import { useRef, useCallback } from 'react';
import type { TaskStatus } from './useDragAndDrop';

interface UseTouchDragOptions {
  isAdmin: boolean;
  longPressDelay?: number;
  scrollThreshold?: number;
  onDragStart: (taskId: number, sourceColumn: TaskStatus) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (targetColumn: TaskStatus | null) => void;
  onCancel: () => void;
}

export interface TouchDragProps {
  onTouchStart: (e: React.TouchEvent<HTMLElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLElement>) => void;
}

interface TouchState {
  taskId: number;
  sourceColumn: TaskStatus;
  startX: number;
  startY: number;
  isDragging: boolean;
  longPressTimer: ReturnType<typeof setTimeout> | null;
  animFrameId: number | null;
}

const COLUMN_DATA_ATTR = 'data-column-id';

export function useTouchDrag({
  isAdmin,
  longPressDelay = 500,
  scrollThreshold = 10,
  onDragStart,
  onDragMove,
  onDragEnd,
  onCancel,
}: UseTouchDragOptions) {
  const stateRef = useRef<TouchState | null>(null);

  const clearTimer = useCallback(() => {
    if (stateRef.current?.longPressTimer) {
      clearTimeout(stateRef.current.longPressTimer);
      stateRef.current.longPressTimer = null;
    }
  }, []);

  const clearAnimFrame = useCallback(() => {
    if (stateRef.current?.animFrameId) {
      cancelAnimationFrame(stateRef.current.animFrameId);
      stateRef.current.animFrameId = null;
    }
  }, []);

  const findColumnUnderPoint = useCallback(
    (x: number, y: number): TaskStatus | null => {
      const element = document.elementFromPoint(x, y);
      if (!element) return null;

      const column = (element as HTMLElement).closest(`[${COLUMN_DATA_ATTR}]`);
      if (column) {
        return column.getAttribute(COLUMN_DATA_ATTR) as TaskStatus;
      }
      return null;
    },
    [],
  );

  const getTouchDragProps = useCallback(
    (taskId: number, sourceColumn: TaskStatus): TouchDragProps => {
      return {
        onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
          if (!isAdmin) return;

          const touch = e.touches[0];
          stateRef.current = {
            taskId,
            sourceColumn,
            startX: touch.clientX,
            startY: touch.clientY,
            isDragging: false,
            longPressTimer: null,
            animFrameId: null,
          };

          stateRef.current.longPressTimer = setTimeout(() => {
            if (stateRef.current && !stateRef.current.isDragging) {
              stateRef.current.isDragging = true;
              onDragStart(taskId, sourceColumn);
            }
          }, longPressDelay);
        },

        onTouchMove: (e: React.TouchEvent<HTMLElement>) => {
          if (!stateRef.current) return;

          const touch = e.touches[0];
          const deltaY = Math.abs(touch.clientY - stateRef.current.startY);

          // If moved vertically before long press, treat as scroll
          if (!stateRef.current.isDragging && deltaY > scrollThreshold) {
            clearTimer();
            stateRef.current = null;
            return;
          }

          if (stateRef.current.isDragging) {
            e.preventDefault();
            // Update preview position via requestAnimationFrame
            clearAnimFrame();
            stateRef.current.animFrameId = requestAnimationFrame(() => {
              onDragMove(touch.clientX, touch.clientY);
            });
          }
        },

        onTouchEnd: (e: React.TouchEvent<HTMLElement>) => {
          if (!stateRef.current) return;

          clearTimer();
          clearAnimFrame();

          if (stateRef.current.isDragging) {
            // Find column under the last touch point
            const touch = e.changedTouches[0];
            const targetColumn = findColumnUnderPoint(
              touch.clientX,
              touch.clientY,
            );
            onDragEnd(targetColumn);
          } else {
            // Touch released before long press - cancel
            onCancel();
          }

          stateRef.current = null;
        },
      };
    },
    [
      isAdmin,
      longPressDelay,
      scrollThreshold,
      onDragStart,
      onDragMove,
      onDragEnd,
      onCancel,
      clearTimer,
      clearAnimFrame,
      findColumnUnderPoint,
    ],
  );

  return { getTouchDragProps };
}
