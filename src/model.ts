import { formatDate, isCanonicalDate, normalizeDate } from './dates';
export type Entry = {
  id: string;
  title: string;
  organization: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  details: string;
};
export type SectionKind = 'projects' | 'languages' | 'awards' | 'volunteer' | 'custom';
/** An extra resume section: a heading plus entries, rendered according to its kind. */
export type Section = { id: string; kind: SectionKind; heading: string; entries: Entry[] };
export const SECTION_KINDS: SectionKind[] = [
  'projects',
  'languages',
  'awards',
  'volunteer',
  'custom',
];
export const DEFAULT_HEADINGS: Record<SectionKind, string> = {
  projects: 'Projects',
  languages: 'Languages',
  awards: 'Awards',
  volunteer: 'Volunteer Experience',
  custom: 'Additional Information',
};
export type Resume = {
  version: 2;
  contact: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    links: string;
  };
  summary: string;
  experience: Entry[];
  education: Entry[];
  skills: string;
  certifications: string;
  /** Extra sections, shown after Certifications in this order. Added in version 2. */
  sections: Section[];
  paper: 'A4' | 'LETTER';
};
export const uid = () => crypto.randomUUID();
export const entry = (): Entry => ({
  id: uid(),
  title: '',
  organization: '',
  location: '',
  start: '',
  end: '',
  current: false,
  details: '',
});
export const section = (kind: SectionKind): Section => ({
  id: uid(),
  kind,
  heading: DEFAULT_HEADINGS[kind],
  entries: [entry()],
});
export const blank = (): Resume => ({
  version: 2,
  contact: { name: '', title: '', email: '', phone: '', location: '', links: '' },
  summary: '',
  experience: [],
  education: [],
  skills: '',
  certifications: '',
  sections: [],
  paper: 'A4',
});
export const sample = (): Resume => ({
  ...blank(),
  contact: {
    name: 'Alex Rivera',
    title: 'Operations Coordinator',
    email: 'alex.rivera@example.com',
    phone: '+63 917 000 1234',
    location: 'Quezon City, Philippines',
    links: 'linkedin.com/in/alex-rivera',
  },
  summary:
    'Operations coordinator with three years of experience in reporting, records management, and team support. Builds clear tracking systems and improves day-to-day workflows with Google Sheets and practical automation.',
  experience: [
    {
      ...entry(),
      title: 'Operations Coordinator',
      organization: 'Northline Services',
      location: 'Quezon City',
      start: '2024-01',
      end: '',
      current: true,
      details:
        'Maintained a tracking system for 200 monthly requests, reducing missed follow-ups by 30%.\nBuilt weekly reports in Google Sheets to help a five-person team prioritize overdue tasks.\nCoordinated schedules and records across three departments.',
    },
    {
      ...entry(),
      title: 'Administrative Assistant',
      organization: 'Civic Support Center',
      location: 'Manila',
      start: '2023-01',
      end: '2023-12',
      current: false,
      details:
        'Organized 1,500 digital records using consistent naming and access controls.\nPrepared meeting notes and tracked action items for the operations team.',
    },
  ],
  education: [
    {
      ...entry(),
      title: 'Bachelor of Science in Business Administration',
      organization: 'Metro City College',
      location: 'Manila',
      start: '2018-08',
      end: '2022-06',
      current: false,
      details: 'Relevant coursework: business analytics, project management, and operations.',
    },
  ],
  skills:
    'Google Sheets, Microsoft Excel, Records Management, Data Cleaning, Report Writing, Scheduling',
  certifications: 'Google Project Management Certificate, Coursera, 2023',
  sections: [
    {
      id: uid(),
      kind: 'projects',
      heading: 'Projects',
      entries: [
        {
          ...entry(),
          title: 'Request Tracker Automation',
          organization: 'Personal project · Google Apps Script',
          start: '2024-06',
          details:
            'Automated reminder emails for overdue requests, saving about two hours of follow-up each week.',
        },
      ],
    },
    {
      id: uid(),
      kind: 'languages',
      heading: 'Languages',
      entries: [
        { ...entry(), title: 'Filipino', organization: 'Native' },
        { ...entry(), title: 'English', organization: 'Professional' },
      ],
    },
  ],
});
/** Normalise loose dates ("Jan 2024", "2024", "Present") in place. Unrecognised text is kept. */
export function fixDates(e: Entry): Entry {
  const start = normalizeDate(e.start);
  const end = normalizeDate(e.end);
  e.start = start.current ? e.start.trim() : start.value;
  e.end = end.value;
  if (end.current) e.current = true;
  return e;
}
/** Entries whose dates could not be understood (shown as typed). */
export const badDates = (e: Entry) =>
  !isCanonicalDate(e.start) || (!e.current && !isCanonicalDate(e.end));
/**
 * Best-effort recovery for data that fails parseResume: keeps every string it can find,
 * never throws for an object. Used by "Try to restore".
 */
export function salvageResume(raw: unknown): Resume {
  if (!raw || typeof raw !== 'object') throw new Error('Nothing recoverable in the saved data.');
  const r = raw as Record<string, any>;
  const str = (x: unknown) =>
    typeof x === 'string' ? x.slice(0, 20000) : typeof x === 'number' ? String(x) : '';
  const result = blank();
  const c = r.contact && typeof r.contact === 'object' ? r.contact : {};
  for (const key of Object.keys(result.contact) as (keyof Resume['contact'])[])
    result.contact[key] = str(c[key]);
  for (const key of ['summary', 'skills', 'certifications'] as const) result[key] = str(r[key]);
  const salvageEntries = (x: unknown) =>
    (Array.isArray(x) ? x.slice(0, 100) : [])
      .filter((e: unknown) => e && typeof e === 'object')
      .map((e: any) => {
        const out = entry();
        for (const f of fields) (out as any)[f] = str(e[f]);
        out.current = e.current === true || e.current === 'true';
        return fixDates(out);
      });
  for (const key of ['experience', 'education'] as const) result[key] = salvageEntries(r[key]);
  result.sections = (Array.isArray(r.sections) ? r.sections.slice(0, 30) : [])
    .filter((x: any) => x && typeof x === 'object')
    .map((x: any) => {
      const kind: SectionKind = SECTION_KINDS.includes(x.kind) ? x.kind : 'custom';
      return {
        id: uid(),
        kind,
        heading: str(x.heading) || DEFAULT_HEADINGS[kind],
        entries: salvageEntries(x.entries),
      };
    });
  if (r.paper === 'LETTER') result.paper = 'LETTER';
  return result;
}
const fields = ['title', 'organization', 'location', 'start', 'end', 'details'];
const MAX_TEXT = 20000;
function parseEntry(e: any, text: (x: unknown) => string): Entry {
  if (!e || typeof e !== 'object' || typeof e.current !== 'boolean')
    throw new Error('Invalid entry.');
  const out = entry();
  for (const f of fields) (out as any)[f] = text(e[f]);
  out.current = e.current;
  return fixDates(out);
}
/**
 * Validate a saved draft or JSON backup (version 1 or 2) and return a clean version 2 resume.
 * Version 1 data has no extra sections and migrates without loss.
 */
export function parseResume(raw: unknown): Resume {
  if (!raw || typeof raw !== 'object') throw new Error('Choose a Folio JSON backup.');
  const r = raw as Record<string, any>;
  if (
    (r.version !== 1 && r.version !== 2) ||
    !r.contact ||
    typeof r.contact !== 'object' ||
    !['A4', 'LETTER'].includes(r.paper)
  )
    throw new Error('This backup format is not supported.');
  const text = (x: unknown) => {
    if (typeof x !== 'string' || x.length > MAX_TEXT)
      throw new Error('The backup contains invalid or very long text.');
    return x;
  };
  const list = (x: unknown, max = 100) => {
    if (!Array.isArray(x) || x.length > max) throw new Error('Invalid resume entries.');
    return x;
  };
  const result = blank();
  for (const key of Object.keys(result.contact) as (keyof Resume['contact'])[])
    result.contact[key] = text(r.contact[key]);
  for (const key of ['summary', 'skills', 'certifications'] as const) result[key] = text(r[key]);
  for (const key of ['experience', 'education'] as const)
    result[key] = list(r[key]).map((e) => parseEntry(e, text));
  if (r.version === 2)
    result.sections = list(r.sections, 30).map((x: any) => {
      if (!x || typeof x !== 'object' || !SECTION_KINDS.includes(x.kind))
        throw new Error('Invalid resume section.');
      return {
        id: uid(),
        kind: x.kind,
        heading: text(x.heading),
        entries: list(x.entries).map((e) => parseEntry(e, text)),
      };
    });
  result.paper = r.paper;
  return result;
}
export const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean);
export const month = formatDate;
export const dates = (e: Entry) =>
  [month(e.start), e.current ? 'Present' : month(e.end)].filter(Boolean).join(' - ');
export const nonempty = (e: Entry) =>
  !![e.title, e.organization, e.location, e.start, e.end, e.details].some((s) => s.trim());
export type Block = {
  text: string;
  kind: 'name' | 'title' | 'contact' | 'heading' | 'role' | 'meta' | 'body' | 'bullet';
};
export function blocks(r: Resume): Block[] {
  const b: Block[] = [];
  const add = (text: string, kind: Block['kind']) => {
    if (text.trim()) b.push({ text: text.trim(), kind });
  };
  add(r.contact.name, 'name');
  add(r.contact.title, 'title');
  add(
    [r.contact.email, r.contact.phone, r.contact.location].filter(Boolean).join(' | '),
    'contact',
  );
  lines(r.contact.links).forEach((t) => add(t, 'contact'));
  if (r.summary.trim()) {
    add('Summary', 'heading');
    add(r.summary, 'body');
  }
  for (const section of ['experience', 'education'] as const) {
    const entries = r[section].filter(nonempty);
    if (entries.length) {
      add(section === 'experience' ? 'Experience' : 'Education', 'heading');
      entries.forEach((e) => {
        add(e.title, 'role');
        add([e.organization, e.location, dates(e)].filter(Boolean).join(' | '), 'meta');
        lines(e.details).forEach((t) => add(t, section === 'experience' ? 'bullet' : 'body'));
      });
    }
  }
  if (r.skills.trim()) {
    add('Skills', 'heading');
    add(r.skills, 'body');
  }
  if (r.certifications.trim()) {
    add('Certifications', 'heading');
    lines(r.certifications).forEach((t) => add(t, 'body'));
  }
  for (const s of r.sections) {
    const entries = s.entries.filter(nonempty);
    if (!entries.length) continue;
    add(s.heading.trim() || DEFAULT_HEADINGS[s.kind], 'heading');
    if (s.kind === 'languages') {
      add(
        entries
          .map((e) =>
            e.organization.trim() ? `${e.title.trim()} (${e.organization.trim()})` : e.title.trim(),
          )
          .filter(Boolean)
          .join(', '),
        'body',
      );
      continue;
    }
    entries.forEach((e) => {
      add(e.title, 'role');
      const when = s.kind === 'awards' ? formatDate(e.start) : dates(e);
      add([e.organization, e.location, when].filter(Boolean).join(' | '), 'meta');
      lines(e.details).forEach((t) => add(t, s.kind === 'awards' ? 'body' : 'bullet'));
    });
  }
  return b;
}
export const filename = (r: Resume) =>
  `${
    r.contact.name
      .trim()
      .replace(/[^\p{L}\p{N}-]+/gu, '-')
      .replace(/^-|-$/g, '') || 'My'
  }-Resume`;
