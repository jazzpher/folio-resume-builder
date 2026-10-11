// Loose date handling. Saved drafts and imported backups may contain dates typed
// as free text ("Jan 2024", "2024", "Present") because <input type="month"> is not
// supported everywhere. We normalise what we can and keep the rest as typed, so a
// date never causes a draft to be rejected.

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export type ParsedDate = {
  /** Canonical value: '', 'YYYY', 'YYYY-MM', or the trimmed original text when not recognised. */
  value: string;
  /** True when the text means "ongoing" (Present, Current, Now…). */
  current: boolean;
  /** False when the text could not be understood; `value` then holds it unchanged. */
  valid: boolean;
};

const CURRENT = /^(present|current|currently|now|ongoing|to date|today)$/i;

function monthIndex(name: string): number {
  let n = name.toLowerCase().replace(/\.$/, '');
  if (n === 'sept') n = 'sep';
  if (n.length < 3) return -1;
  return MONTHS.findIndex((m) => m.toLowerCase().startsWith(n));
}

const ym = (y: string, m: number) => `${y}-${String(m).padStart(2, '0')}`;

export function normalizeDate(input: string): ParsedDate {
  const s = input.trim().replace(/\s+/g, ' ');
  if (!s) return { value: '', current: false, valid: true };
  if (CURRENT.test(s)) return { value: '', current: true, valid: true };
  let m = /^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/.exec(s);
  if (m && +m[2] >= 1 && +m[2] <= 12)
    return { value: ym(m[1], +m[2]), current: false, valid: true };
  m = /^(\d{1,2})[-/.](\d{4})$/.exec(s);
  if (m && +m[1] >= 1 && +m[1] <= 12)
    return { value: ym(m[2], +m[1]), current: false, valid: true };
  m = /^([A-Za-z]+)\.?,?[ -]?(\d{4})$/.exec(s);
  if (m) {
    const i = monthIndex(m[1]);
    if (i >= 0) return { value: ym(m[2], i + 1), current: false, valid: true };
  }
  m = /^(\d{4})$/.exec(s);
  if (m) return { value: m[1], current: false, valid: true };
  return { value: s, current: false, valid: false };
}

export const isCanonicalDate = (s: string) => s === '' || /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(s);

/** Long form for the resume: "January 2024", "2024", or the text as typed. */
export function formatDate(s: string): string {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(s);
  if (m) return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return s;
}

/** Short form for the editor field: "Jan 2024", "2024", or the text as typed. */
export function shortDate(s: string): string {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(s);
  if (m) return `${MONTHS[Number(m[2]) - 1].slice(0, 3)} ${m[1]}`;
  return s;
}
