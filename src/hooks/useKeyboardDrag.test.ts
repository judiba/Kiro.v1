import { describe, it, expect, mock } from 'bun:test';
import type { TaskStatus } from './useDragAndDrop';

// ── Pure logic extracted from useKeyboardDrag ─────────────────────────────────
// We test the state-machine logic without React hooks by simulating the
// transitions that handleKeyDown performs.

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

const COLUMN_NAMES: Record<TaskStatus, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  done: 'Concluída',
};

interface KbState {
  isActive: boolean;
  taskId: number | null;
  taskTitle: string;
  sourceColumn: TaskStatus | null;
  currentTargetIndex: number;
}

function makeInitialState(): KbState {
  return {
    isActive: false,
    taskId: null,
    taskTitle: '',
    sourceColumn: null,
    currentTargetIndex: 0,
  };
}

// Simulate the key handler logic from useKeyboardDrag
function handleKey(
  state: KbState,
  key: string,
  taskId: number,
  taskTitle: string,
  sourceColumn: TaskStatus,
  isAdmin: boolean,
  onMove: (id: number, col: TaskStatus) => void,
  onAnnounce: (msg: string) => void,
): KbState {
  if (!isAdmin) return state;

  if (!state.isActive) {
    if (key === 'Enter' || key === ' ') {
      const sourceIndex = COLUMNS.indexOf(sourceColumn);
      onAnnounce(`Modo arrastar ativado para "${taskTitle}".`);
      return { isActive: true, taskId, taskTitle, sourceColumn, currentTargetIndex: sourceIndex };
    }
    return state;
  }

  if (state.taskId !== taskId) return state;

  switch (key) {
    case 'ArrowLeft': {
      const newIndex = Math.max(0, state.currentTargetIndex - 1);
      onAnnounce(`Coluna ${COLUMN_NAMES[COLUMNS[newIndex]]} selecionada.`);
      return { ...state, currentTargetIndex: newIndex };
    }
    case 'ArrowRight': {
      const newIndex = Math.min(COLUMNS.length - 1, state.currentTargetIndex + 1);
      onAnnounce(`Coluna ${COLUMN_NAMES[COLUMNS[newIndex]]} selecionada.`);
      return { ...state, currentTargetIndex: newIndex };
    }
    case 'Enter': {
      const target = COLUMNS[state.currentTargetIndex];
      if (target !== state.sourceColumn) {
        onMove(taskId, target);
        onAnnounce(`Tarefa "${state.taskTitle}" movida para ${COLUMN_NAMES[target]}.`);
      } else {
        onAnnounce('Operação cancelada. Tarefa permanece na mesma coluna.');
      }
      return makeInitialState();
    }
    case 'Escape': {
      onAnnounce('Operação de arrastar cancelada.');
      return makeInitialState();
    }
    default:
      return state;
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useKeyboardDrag — state machine', () => {
  it('does nothing when isAdmin is false', () => {
    const onMove = mock(() => {});
    const onAnnounce = mock(() => {});
    const state = makeInitialState();
    const next = handleKey(state, 'Enter', 1, 'Task', 'todo', false, onMove, onAnnounce);
    expect(next.isActive).toBe(false);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('activates drag mode on Enter', () => {
    const onAnnounce = mock(() => {});
    const state = makeInitialState();
    const next = handleKey(state, 'Enter', 1, 'Task A', 'todo', true, mock(() => {}), onAnnounce);
    expect(next.isActive).toBe(true);
    expect(next.taskId).toBe(1);
    expect(next.sourceColumn).toBe('todo');
    expect(next.currentTargetIndex).toBe(0); // 'todo' is index 0
    expect(onAnnounce).toHaveBeenCalledWith(expect.stringContaining('Task A'));
  });

  it('activates drag mode on Space', () => {
    const state = makeInitialState();
    const next = handleKey(state, ' ', 2, 'Task B', 'in_progress', true, mock(() => {}), mock(() => {}));
    expect(next.isActive).toBe(true);
    expect(next.currentTargetIndex).toBe(1); // 'in_progress' is index 1
  });

  it('ArrowRight moves target index forward', () => {
    const onAnnounce = mock(() => {});
    let state = makeInitialState();
    state = handleKey(state, 'Enter', 1, 'Task', 'todo', true, mock(() => {}), onAnnounce);
    state = handleKey(state, 'ArrowRight', 1, 'Task', 'todo', true, mock(() => {}), onAnnounce);
    expect(state.currentTargetIndex).toBe(1);
    expect(onAnnounce).toHaveBeenCalledWith(expect.stringContaining('Em Progresso'));
  });

  it('ArrowLeft moves target index backward', () => {
    let state = makeInitialState();
    state = handleKey(state, 'Enter', 1, 'Task', 'in_progress', true, mock(() => {}), mock(() => {}));
    expect(state.currentTargetIndex).toBe(1);
    state = handleKey(state, 'ArrowLeft', 1, 'Task', 'in_progress', true, mock(() => {}), mock(() => {}));
    expect(state.currentTargetIndex).toBe(0);
  });

  it('ArrowLeft does not go below index 0', () => {
    let state = makeInitialState();
    state = handleKey(state, 'Enter', 1, 'Task', 'todo', true, mock(() => {}), mock(() => {}));
    state = handleKey(state, 'ArrowLeft', 1, 'Task', 'todo', true, mock(() => {}), mock(() => {}));
    expect(state.currentTargetIndex).toBe(0);
  });

  it('ArrowRight does not exceed last column index', () => {
    let state = makeInitialState();
    state = handleKey(state, 'Enter', 1, 'Task', 'done', true, mock(() => {}), mock(() => {}));
    state = handleKey(state, 'ArrowRight', 1, 'Task', 'done', true, mock(() => {}), mock(() => {}));
    expect(state.currentTargetIndex).toBe(2);
  });

  it('Enter confirms move to a different column and resets state', () => {
    const onMove = mock(() => {});
    const onAnnounce = mock(() => {});
    let state = makeInitialState();
    state = handleKey(state, 'Enter', 1, 'Task', 'todo', true, onMove, onAnnounce);
    state = handleKey(state, 'ArrowRight', 1, 'Task', 'todo', true, onMove, onAnnounce);
    state = handleKey(state, 'Enter', 1, 'Task', 'todo', true, onMove, onAnnounce);
    expect(onMove).toHaveBeenCalledWith(1, 'in_progress');
    expect(state.isActive).toBe(false);
  });

  it('Enter on same column cancels without calling onMove', () => {
    const onMove = mock(() => {});
    let state = makeInitialState();
    state = handleKey(state, 'Enter', 1, 'Task', 'todo', true, onMove, mock(() => {}));
    // currentTargetIndex stays at 0 (same as source 'todo')
    state = handleKey(state, 'Enter', 1, 'Task', 'todo', true, onMove, mock(() => {}));
    expect(onMove).not.toHaveBeenCalled();
    expect(state.isActive).toBe(false);
  });

  it('Escape cancels drag and resets state', () => {
    const onAnnounce = mock(() => {});
    let state = makeInitialState();
    state = handleKey(state, 'Enter', 1, 'Task', 'todo', true, mock(() => {}), onAnnounce);
    state = handleKey(state, 'Escape', 1, 'Task', 'todo', true, mock(() => {}), onAnnounce);
    expect(state.isActive).toBe(false);
    expect(onAnnounce).toHaveBeenCalledWith('Operação de arrastar cancelada.');
  });
});

describe('useKeyboardDrag — column names mapping', () => {
  it('all 3 columns have Portuguese display names', () => {
    expect(COLUMN_NAMES['todo']).toBe('A Fazer');
    expect(COLUMN_NAMES['in_progress']).toBe('Em Progresso');
    expect(COLUMN_NAMES['done']).toBe('Concluída');
  });

  it('COLUMNS array has exactly 3 statuses in correct order', () => {
    expect(COLUMNS).toHaveLength(3);
    expect(COLUMNS[0]).toBe('todo');
    expect(COLUMNS[1]).toBe('in_progress');
    expect(COLUMNS[2]).toBe('done');
  });
});
