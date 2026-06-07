import { describe, it, expect } from 'bun:test';
import { formatDate, isOverdue, formatDateTime, hashPassword } from './helpers';

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns null for null input', () => {
    expect(formatDate(null)).toBeNull();
  });

  it('formats a valid date string in pt-BR short month format', () => {
    const result = formatDate('2026-06-15');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    // Should contain the day number
    expect(result).toContain('15');
  });

  it('formats January correctly', () => {
    const result = formatDate('2026-01-01');
    expect(result).toContain('01');
  });
});

// ── isOverdue ─────────────────────────────────────────────────────────────────

describe('isOverdue', () => {
  it('returns false for null', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('returns true for a date in the past', () => {
    expect(isOverdue('2000-01-01')).toBe(true);
  });

  it('returns false for a date far in the future', () => {
    expect(isOverdue('2099-12-31')).toBe(false);
  });
});

// ── formatDateTime ────────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDateTime('2026-06-07T14:30:00');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the year in the output', () => {
    const result = formatDateTime('2026-06-07T14:30:00');
    expect(result).toContain('2026');
  });
});

// ── hashPassword ──────────────────────────────────────────────────────────────

describe('hashPassword', () => {
  it('returns a non-empty base64 string', () => {
    const hash = hashPassword('admin123');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('is deterministic — same input produces same hash', () => {
    expect(hashPassword('admin123')).toBe(hashPassword('admin123'));
  });

  it('produces different hashes for different passwords', () => {
    expect(hashPassword('admin123')).not.toBe(hashPassword('editor123'));
  });

  it('matches the known hash used by the seed data (admin123)', () => {
    // This is the hash stored in the database by database.ts seed
    const expected = btoa(
      String.fromCharCode(...new Uint8Array(new TextEncoder().encode('admin123'))),
    );
    expect(hashPassword('admin123')).toBe(expected);
  });
});
