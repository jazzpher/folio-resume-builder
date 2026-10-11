import { describe, expect, it } from 'vitest';
import { blank, blocks, entry, parseResume, salvageResume, sample, section } from './model';
import { makeTex } from './latex';
import { KEY, LEGACY_KEY, loadDraft } from './storage';

const v1 = () => {
  const { sections: _s, ...rest } = sample();
  return { ...rest, version: 1 };
};

describe('extra sections', () => {
  it('migrates a version 1 backup without losing anything', () => {
    const r = parseResume(JSON.parse(JSON.stringify(v1())));
    expect(r.version).toBe(2);
    expect(r.sections).toEqual([]);
    expect(r.contact).toEqual(sample().contact);
    expect(r.experience.map((e) => e.title)).toEqual(sample().experience.map((e) => e.title));
  });
  it('migrates a version 1 draft from the old storage key and leaves it in place', () => {
    const data = new Map<string, string>([[LEGACY_KEY, JSON.stringify(v1())]]);
    const store = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    } as unknown as Storage;
    const loaded = loadDraft(store);
    expect(loaded.recovery).toBeNull();
    expect(loaded.resume.contact.name).toBe('Alex Rivera');
    expect(data.has(LEGACY_KEY)).toBe(true);
    expect(data.has(KEY)).toBe(false);
  });
  it('round trips sections through a backup', () => {
    const r = sample();
    expect(blocks(parseResume(JSON.parse(JSON.stringify(r))))).toEqual(blocks(r));
  });
  it('rejects unknown section kinds in a backup but salvage keeps them as custom', () => {
    const bad = { ...sample(), sections: [{ kind: 'hobbies', heading: 'Hobbies', entries: [] }] };
    expect(() => parseResume(bad)).toThrow();
    expect(salvageResume(bad).sections[0]).toMatchObject({ kind: 'custom', heading: 'Hobbies' });
  });
  it('renders languages on one line and awards with a single date', () => {
    const r = blank();
    r.contact.name = 'A';
    const langs = section('languages');
    langs.entries = [
      { ...entry(), title: 'Filipino', organization: 'Native' },
      { ...entry(), title: 'Japanese' },
    ];
    const awards = section('awards');
    awards.entries = [
      { ...entry(), title: 'Dean’s List', organization: 'Metro City College', start: '2021' },
    ];
    const empty = section('volunteer');
    r.sections = [langs, awards, empty];
    expect(blocks(r).slice(1)).toEqual([
      { kind: 'heading', text: 'Languages' },
      { kind: 'body', text: 'Filipino (Native), Japanese' },
      { kind: 'heading', text: 'Awards' },
      { kind: 'role', text: 'Dean’s List' },
      { kind: 'meta', text: 'Metro City College | 2021' },
    ]);
  });
  it('uses the custom heading and includes sections in LaTeX', () => {
    const r = sample();
    r.sections[0].heading = 'Selected Work';
    expect(blocks(r).some((b) => b.kind === 'heading' && b.text === 'Selected Work')).toBe(true);
    expect(makeTex(r)).toContain('Selected Work');
    expect(makeTex(r)).toContain('Filipino (Native), English (Professional)');
  });
});
