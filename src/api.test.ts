import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { TimeoutError, updateStatusWithTimeout } from './api';

// ── TimeoutError ──────────────────────────────────────────────────────────────

describe('TimeoutError', () => {
  it('is an instance of Error', () => {
    const err = new TimeoutError();
    expect(err).toBeInstanceOf(Error);
  });

  it('has name "TimeoutError"', () => {
    expect(new TimeoutError().name).toBe('TimeoutError');
  });

  it('uses the default message when none is provided', () => {
    expect(new TimeoutError().message).toBe('A requisição excedeu o tempo limite.');
  });

  it('accepts a custom message', () => {
    expect(new TimeoutError('custom').message).toBe('custom');
  });
});

// ── updateStatusWithTimeout ───────────────────────────────────────────────────

describe('updateStatusWithTimeout', () => {
  beforeEach(() => {
    // Reset globalThis.fetch before each test
    (globalThis as any).fetch = undefined;
  });

  it('throws TimeoutError when the request is aborted', async () => {
    // Mock fetch to simulate an AbortError
    (globalThis as any).fetch = mock(() => {
      const err = new Error('The operation was aborted.');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    await expect(
      updateStatusWithTimeout(1, 'done', 100),
    ).rejects.toBeInstanceOf(TimeoutError);
  });

  it('resolves with the task when fetch succeeds', async () => {
    const mockTask = { id: 1, status: 'done', title: 'Test task' };

    (globalThis as any).fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTask),
      }),
    );

    const result = await updateStatusWithTimeout(1, 'done', 5000);
    expect(result).toEqual(mockTask);
  });

  it('throws an Error when the server returns a non-ok response', async () => {
    (globalThis as any).fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Task not found' }),
      }),
    );

    await expect(
      updateStatusWithTimeout(99, 'done', 5000),
    ).rejects.toThrow('Task not found');
  });
});
