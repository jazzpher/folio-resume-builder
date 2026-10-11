import { beforeEach, describe, expect, it } from 'vitest';
import { KEY, RECOVERY_KEY, loadDraft } from './storage';
import { blank, blocks, parseResume, salvageResume, sample } from './model';

class MemoryStorage implements Storage {
  data = new Map<string, string>();
  failWrites = false;
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  setItem(k: string, v: string) {
    if (this.failWrites) throw new Error('quota');
    this.data.set(k, String(v));
  }
}

describe('loading a saved draft', () => {
  let store: MemoryStorage;
  beforeEach(() => {
    store = new MemoryStorage();
  });
  it('starts blank when nothing is saved', () => {
    expect(loadDraft(store)).toEqual({ resume: blank(), recovery: null, saveBlocked: false });
  });
  it('accepts free-text dates such as "Jan 2024" instead of discarding the draft', () => {
    const r = sample();
    r.experience[0].start = 'Jan 2024';
    r.experience[1].end = 'Present';
    store.setItem(KEY, JSON.stringify(r));
    const loaded = loadDraft(store);
    expect(loaded.recovery).toBeNull();
    expect(loaded.resume.contact.name).toBe('Alex Rivera');
    expect(loaded.resume.experience[0].start).toBe('2024-01');
    expect(loaded.resume.experience[1].current).toBe(true);
  });
  it('keeps unrecognised dates as typed', () => {
    const r = sample();
    r.education[0].start = 'Fall 2018';
    expect(parseResume(JSON.parse(JSON.stringify(r))).education[0].start).toBe('Fall 2018');
  });
  it('stashes unreadable data under the recovery key instead of losing it', () => {
    const raw = JSON.stringify({ ...sample(), version: 7 });
    store.setItem(KEY, raw);
    const loaded = loadDraft(store);
    expect(loaded.resume).toEqual(blank());
    expect(loaded.recovery).toBe(raw);
    expect(store.getItem(RECOVERY_KEY)).toBe(raw);
    expect(loaded.saveBlocked).toBe(false);
  });
  it('stashes data that is not even JSON', () => {
    store.setItem(KEY, '{broken');
    expect(loadDraft(store).recovery).toBe('{broken');
  });
  it('blocks autosave when the recovery copy cannot be written', () => {
    store.setItem(KEY, '{broken');
    store.failWrites = true;
    expect(loadDraft(store).saveBlocked).toBe(true);
  });
  it('salvages what it can from a damaged draft', () => {
    const r: any = { ...sample(), version: 7, paper: 'A3', summary: 42 };
    r.experience = [{ ...r.experience[0], current: 'true', start: 'Jan 2024' }, null, 'x'];
    const out = salvageResume(r);
    expect(out.contact.name).toBe('Alex Rivera');
    expect(out.summary).toBe('42');
    expect(out.experience).toHaveLength(1);
    expect(out.experience[0].start).toBe('2024-01');
    expect(out.experience[0].current).toBe(true);
    expect(out.paper).toBe('A4');
    expect(blocks(out).some((b) => b.text === 'Operations Coordinator')).toBe(true);
  });
});
