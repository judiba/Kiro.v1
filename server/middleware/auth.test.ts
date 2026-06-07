import { describe, it, expect } from 'bun:test';
import { createToken, verifyToken } from './auth';

describe('createToken', () => {
  it('returns a non-empty string', () => {
    const token = createToken(1, 'admin', 'admin');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('produces a token with two dot-separated segments', () => {
    const token = createToken(1, 'admin', 'admin');
    const parts = token.split('.');
    expect(parts).toHaveLength(2);
  });

  it('embeds the correct payload', () => {
    const token = createToken(42, 'alice', 'editor');
    const payload = JSON.parse(atob(token.split('.')[0]));
    expect(payload.userId).toBe(42);
    expect(payload.username).toBe('alice');
    expect(payload.role).toBe('editor');
  });

  it('includes an iat timestamp', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = createToken(1, 'user', 'viewer');
    const after = Math.floor(Date.now() / 1000);
    const payload = JSON.parse(atob(token.split('.')[0]));
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.iat).toBeLessThanOrEqual(after);
  });
});

describe('verifyToken', () => {
  it('returns the correct payload for a valid token', () => {
    const token = createToken(7, 'bob', 'admin');
    const result = verifyToken(token);
    expect(result).not.toBeNull();
    expect(result!.userId).toBe(7);
    expect(result!.username).toBe('bob');
    expect(result!.role).toBe('admin');
  });

  it('returns null for a token with a tampered signature', () => {
    const token = createToken(1, 'user', 'viewer');
    const tampered = token.split('.')[0] + '.invalidsignature';
    expect(verifyToken(tampered)).toBeNull();
  });

  it('returns null for a completely invalid string', () => {
    expect(verifyToken('not.a.valid.token')).toBeNull();
    expect(verifyToken('garbage')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });

  it('round-trips for all roles', () => {
    for (const role of ['admin', 'editor', 'viewer']) {
      const token = createToken(1, 'user', role);
      const result = verifyToken(token);
      expect(result?.role).toBe(role);
    }
  });
});
