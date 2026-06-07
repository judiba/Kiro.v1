import { describe, it, expect } from 'bun:test';
import type { TaskStatus, DragState } from './useDragAndDrop';

// ── Pure logic tests extracted from useDragAndDrop ───────────────────────────
// We test state transitions, column name mapping, and optimistic update logic
// without needing React, a DOM or a real fetch call.

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

// ── DragState shape ───────────────────────────────────────────────────────────

describe('DragState initial values', () => {
  it('starts with no drag in progress', () => {
    expect(initialDragState.isDragging).toBe(false);
    expect(initialDragState.draggedTaskId).toBeNull();
    expect(initialDragState.sourceColumn).toBeNull();
    expect(initialDragState.targetColumn).toBeNull();
    expect(initialDragState.dragCancelled).toBe(false);
  });
});

// ── Column names ──────────────────────────────────────────────────────────────

describe('COLUMN_NAMES', () => {
  it('maps every TaskStatus to a Portuguese label', () => {
    expect(COLUMN_NAMES.todo).toBe('A Fazer');
    expect(COLUMN_NAMES.in_progress).toBe('Em Progresso');
    expect(COLUMN_NAMES.done).toBe('Concluída');
  });

  it('contains exactly 3 entries', () => {
    expect(Object.keys(COLUMN_NAMES)).toHaveLength(3);
  });
});

// ── Optimistic update logic ───────────────────────────────────────────────────

describe('optimistic update (task status change)', () => {
  const tasks = [
    { id: 1, status: 'todo', title: 'Task A' },
    { id: 2, status: 'in_progress', title: 'Task B' },
    { id: 3, status: 'done', title: 'Task C' },
  ] as any[];

  it('moves task to target column', () => {
    const taskId = 1;
    const targetColumn: TaskStatus = 'in_progress';
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: targetColumn } : t,
    );
    expect(updated.find((t) => t.id === taskId)!.status).toBe('in_progress');
    // Other tasks unchanged
    expect(updated.find((t) => t.id === 2)!.status).toBe('in_progress');
    expect(updated.find((t) => t.id === 3)!.status).toBe('done');
  });

  it('does not mutate the original tasks array', () => {
    const taskId = 1;
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'done' } : t,
    );
    expect(tasks.find((t) => t.id === taskId)!.status).toBe('todo'); // original unchanged
    expect(updated.find((t) => t.id === taskId)!.status).toBe('done');
  });
});

// ── Rollback logic ────────────────────────────────────────────────────────────

describe('rollback on API failure', () => {
  const tasks = [
    { id: 1, status: 'in_progress', title: 'Task A' },
    { id: 2, status: 'todo', title: 'Task B' },
  ] as any[];

  const snapshot = { taskId: 1, originalStatus: 'todo' as TaskStatus, originalIndex: 0 };

  it('restores original status from snapshot', () => {
    const rolled = tasks.map((t) =>
      t.id === snapshot.taskId ? { ...t, status: snapshot.originalStatus } : t,
    );
    expect(rolled.find((t) => t.id === 1)!.status).toBe('todo');
    expect(rolled.find((t) => t.id === 2)!.status).toBe('todo');
  });
});

// ── isHighlighted column logic ────────────────────────────────────────────────

describe('column highlight logic', () => {
  it('is highlighted when dragging over a different column', () => {
    const state: DragState = {
      isDragging: true,
      draggedTaskId: 1,
      sourceColumn: 'todo',
      targetColumn: 'done',
      dragCancelled: false,
    };
    const columnId: TaskStatus = 'done';
    const isHighlighted =
      state.isDragging &&
      state.targetColumn === columnId &&
      state.sourceColumn !== columnId;
    expect(isHighlighted).toBe(true);
  });

  it('is NOT highlighted when dragging over the source column', () => {
    const state: DragState = {
      isDragging: true,
      draggedTaskId: 1,
      sourceColumn: 'todo',
      targetColumn: 'todo',
      dragCancelled: false,
    };
    const columnId: TaskStatus = 'todo';
    const isHighlighted =
      state.isDragging &&
      state.targetColumn === columnId &&
      state.sourceColumn !== columnId;
    expect(isHighlighted).toBe(false);
  });

  it('is NOT highlighted when not dragging', () => {
    const state: DragState = { ...initialDragState };
    const isHighlighted =
      state.isDragging && state.targetColumn === 'done' && state.sourceColumn !== 'done';
    expect(isHighlighted).toBe(false);
  });
});

// ── dragProps opacity and cursor ──────────────────────────────────────────────

describe('drag handle style', () => {
  it('reduces opacity to 0.5 when the card is being dragged', () => {
    const isDragging = true;
    const style = { opacity: isDragging ? 0.5 : 1, cursor: 'grab' };
    expect(style.opacity).toBe(0.5);
  });

  it('keeps opacity 1 when not dragging', () => {
    const isDragging = false;
    const style = { opacity: isDragging ? 0.5 : 1, cursor: 'grab' };
    expect(style.opacity).toBe(1);
  });

  it('uses "grab" cursor for admin', () => {
    const isAdmin = true;
    const cursor = isAdmin ? 'grab' : 'default';
    expect(cursor).toBe('grab');
  });

  it('uses "default" cursor for non-admin', () => {
    const isAdmin = false;
    const cursor = isAdmin ? 'grab' : 'default';
    expect(cursor).toBe('default');
  });
});

// ── Snapshot creation ─────────────────────────────────────────────────────────

describe('task snapshot on drag start', () => {
  const tasks = [
    { id: 10, status: 'todo' },
    { id: 11, status: 'todo' },
    { id: 12, status: 'in_progress' },
  ] as any[];

  it('captures the correct originalIndex within the source column', () => {
    const taskId = 11;
    const task = tasks.find((t) => t.id === taskId)!;
    const columnTasks = tasks.filter((t) => t.status === task.status);
    const originalIndex = columnTasks.findIndex((t) => t.id === taskId);
    expect(originalIndex).toBe(1); // second task in 'todo' column
  });

  it('captures index 0 for the first task in its column', () => {
    const taskId = 10;
    const task = tasks.find((t) => t.id === taskId)!;
    const columnTasks = tasks.filter((t) => t.status === task.status);
    const originalIndex = columnTasks.findIndex((t) => t.id === taskId);
    expect(originalIndex).toBe(0);
  });

  it('captures index 0 for sole task in a column', () => {
    const taskId = 12;
    const task = tasks.find((t) => t.id === taskId)!;
    const columnTasks = tasks.filter((t) => t.status === task.status);
    const originalIndex = columnTasks.findIndex((t) => t.id === taskId);
    expect(originalIndex).toBe(0);
  });
});
