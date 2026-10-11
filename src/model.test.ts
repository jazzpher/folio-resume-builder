import { describe, it, expect } from 'vitest';
import { blank, parseResume, sample, blocks, dates, filename } from './model';
import { escapeTex, makeTex } from './latex';
describe('resume data', () => {
  it('round trips a blank and sample backup', () => {
    for (const r of [blank(), sample()])
      expect(blocks(parseResume(JSON.parse(JSON.stringify(r))))).toEqual(blocks(r));
  });
  it('rejects malformed backups', () => {
    for (const x of [
      null,
      [],
      { version: 2 },
      { ...sample(), experience: [{}] },
      { ...sample(), paper: 'A3' },
      { ...sample(), summary: 5 },
      { ...sample(), education: [{ ...sample().education[0], start: 7 }] },
    ])
      expect(() => parseResume(x)).toThrow();
  });
  it('drops foreign keys and refreshes ids', () => {
    const r = sample();
    const next = parseResume({ ...r, token: 'unsafe' });
    expect(next).not.toHaveProperty('token');
    expect(next.experience[0].id).not.toBe(r.experience[0].id);
  });
  it('keeps reading order and standard headings', () => {
    expect(
      blocks(sample())
        .filter((b) => b.kind === 'heading')
        .map((b) => b.text),
    ).toEqual([
      'Summary',
      'Experience',
      'Education',
      'Skills',
      'Certifications',
      'Projects',
      'Languages',
    ]);
    expect(blocks(blank())).toEqual([]);
  });
  it('formats month dates and current work', () =>
    expect(dates(sample().experience[0])).toBe('January 2024 - Present'));
  it('makes safe filenames', () => {
    const r = blank();
    r.contact.name = '../../Alex & Jo';
    expect(filename(r)).toBe('Alex-Jo-Resume');
  });
  it('escapes LaTeX control characters', () => {
    expect(escapeTex('50% & $x_# {a} \\ ~ ^')).toBe(
      '50\\% \\& \\$x\\_\\# \\{a\\} \\textbackslash{} \\textasciitilde{} \\textasciicircum{}',
    );
  });
  it('exports a single-column source with compiler guidance', () => {
    const tex = makeTex(sample());
    expect(tex).toContain('Compile with pdfLaTeX');
    expect(tex).not.toMatch(/tabular|multicol|includegraphics/);
    expect(tex).toContain('Alex Rivera');
  });
});
