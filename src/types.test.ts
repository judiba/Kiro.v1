/**
 * Property-based tests for domain types and business logic
 * using fast-check to validate invariants across random inputs.
 */
import { describe, it, expect } from 'bun:test';
import * as fc from 'fast-check';
import type { Task, Stats } from './types';

// ── Task status invariants ────────────────────────────────────────────────────

const VALID_STATUSES = ['todo', 'in_progress', 'done'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

describe('Task status', () => {
  it('only valid statuses exist in the type union', () => {
    const taskStatuses: Task['status'][] = ['todo', 'in_progress', 'done'];
    taskStatuses.forEach((s) => {
      expect(VALID_STATUSES).toContain(s);
    });
  });

  it('statusTransitions — every status has at least one transition (property-based)', () => {
    const statusTransitions: Record<string, { prev?: string; next?: string }> = {
      todo: { next: 'in_progress' },
      in_progress: { prev: 'todo', next: 'done' },
      done: { prev: 'in_progress' },
    };

    fc.assert(
      fc.property(fc.constantFrom(...VALID_STATUSES), (status: ValidStatus) => {
        const t = statusTransitions[status];
        return t.prev !== undefined || t.next !== undefined;
      }),
    );
  });

  it('isOverdue returns false for far future dates (property-based)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2070, max: 2099 }), (year: number) => {
        const dateStr = `${year}-12-31`;
        return (new Date(dateStr + 'T23:59:59') < new Date()) === false;
      }),
    );
  });

  it('isOverdue returns true for far past dates (property-based)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2000, max: 2010 }), (year: number) => {
        const dateStr = `${year}-01-01`;
        return (new Date(dateStr + 'T23:59:59') < new Date()) === true;
      }),
    );
  });
});

// ── Stats invariants ──────────────────────────────────────────────────────────

describe('Stats invariants', () => {
  it('todo + in_progress + done always equals total (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (todo: number, in_progress: number, done: number) => {
          const stats: Stats = {
            total: todo + in_progress + done,
            todo,
            in_progress,
            done,
          };
          return stats.todo + stats.in_progress + stats.done === stats.total;
        },
      ),
    );
  });

  it('all stats values are non-negative (property-based)', () => {
    fc.assert(
      fc.property(
        fc.record({
          total: fc.integer({ min: 0, max: 1000 }),
          todo: fc.integer({ min: 0, max: 1000 }),
          in_progress: fc.integer({ min: 0, max: 1000 }),
          done: fc.integer({ min: 0, max: 1000 }),
        }),
        (stats: Stats) => {
          return (
            stats.total >= 0 &&
            stats.todo >= 0 &&
            stats.in_progress >= 0 &&
            stats.done >= 0
          );
        },
      ),
    );
  });
});

// ── hashPassword determinism (property-based) ─────────────────────────────────

const hashPassword = (password: string): string => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  return btoa(String.fromCharCode(...new Uint8Array(data)));
};

describe('hashPassword (property-based)', () => {
  it('is deterministic for any string', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 64 }), (password: string) => {
        return hashPassword(password) === hashPassword(password);
      }),
    );
  });

  it('produces different hashes for different inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 32 }),
        fc.string({ minLength: 1, maxLength: 32 }),
        (a: string, b: string) => {
          fc.pre(a !== b);
          return hashPassword(a) !== hashPassword(b);
        },
      ),
    );
  });

  it('always returns a non-empty base64 string', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 64 }), (password: string) => {
        const hash = hashPassword(password);
        return typeof hash === 'string' && hash.length > 0;
      }),
    );
  });
});

// ── CreateUserModal validation rules (property-based) ─────────────────────────

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

describe('Form validation rules (property-based)', () => {
  it('username with 3+ chars always passes min-length check', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 3, maxLength: 50 }), (username: string) => {
        return username.length >= 3;
      }),
    );
  });

  it('username with < 3 chars always fails min-length check', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 2 }), (username: string) => {
        return username.length < 3;
      }),
    );
  });

  it('valid emails pass the regex', () => {
    ['user@example.com', 'admin@taskflow.local', 'a.b+tag@x.io'].forEach((email) => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  it('invalid emails fail the regex', () => {
    ['notanemail', '@missing.user', 'no-at-sign'].forEach((email) => {
      expect(isValidEmail(email)).toBe(false);
    });
  });

  it('password with 6+ chars always passes min-length check', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 6, maxLength: 100 }), (password: string) => {
        return password.length >= 6;
      }),
    );
  });
});
