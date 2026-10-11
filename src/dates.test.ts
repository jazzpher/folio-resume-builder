import { describe, expect, it } from 'vitest';
import { formatDate, normalizeDate, shortDate } from './dates';

describe('loose dates', () => {
  it.each([
    ['2024-01', '2024-01'],
    ['2024-1', '2024-01'],
    ['2024/03/15', '2024-03'],
    ['01/2024', '2024-01'],
    ['3.2024', '2024-03'],
    ['Jan 2024', '2024-01'],
    ['jan. 2024', '2024-01'],
    ['January 2024', '2024-01'],
    ['Sept 2023', '2023-09'],
    ['Dec, 2020', '2020-12'],
    ['2024', '2024'],
    ['', ''],
  ])('normalises %s', (input, value) => {
    expect(normalizeDate(input)).toEqual({ value, current: false, valid: true });
  });
  it.each(['Present', 'current', 'Now', 'ongoing'])('reads %s as current', (input) => {
    expect(normalizeDate(input)).toEqual({ value: '', current: true, valid: true });
  });
  it.each(['2026-13', 'Spring 2024', 'Ja 2024', 'last year'])('keeps %s as typed', (input) => {
    expect(normalizeDate(input)).toEqual({ value: input, current: false, valid: false });
  });
  it('formats long and short forms', () => {
    expect(formatDate('2024-01')).toBe('January 2024');
    expect(formatDate('2024')).toBe('2024');
    expect(formatDate('Spring 2024')).toBe('Spring 2024');
    expect(shortDate('2024-09')).toBe('Sep 2024');
  });
});
