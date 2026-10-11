import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  blank,
  blocks,
  entry,
  filename,
  parseResume,
  salvageResume,
  sample,
  type Resume,
  type Entry,
} from './model';
import { download } from './download';
import { DateField } from './DateField';
import { isCanonicalDate } from './dates';
import { KEY, clearRecovery, loadDraft } from './storage';
import './style.css';
const sections = ['Contact', 'Summary', 'Experience', 'Education', 'Skills', 'Certifications'];
function App() {
  const [loaded] = useState(loadDraft);
  const [resume, setResume] = useState<Resume>(loaded.resume);
  const [recovery, setRecovery] = useState<string | null>(loaded.recovery);
  const saveBlocked = useRef(loaded.saveBlocked);
  const [active, setActive] = useState('Contact');
  const [view, setView] = useState('edit');
  const [status, setStatus] = useState('Ready to edit');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState<{ text: string; run: () => void } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (saveBlocked.current) {
      setStatus('Not saved');
      return;
    }
    setStatus('Saving on this browser…');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(resume));
        setStatus('Saved on this browser');
      } catch {
        setStatus('Not saved');
        setError(
          'Browser storage is unavailable or full. Download a JSON backup to keep your work.',
        );
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [resume]);
  const change = (key: keyof Resume, value: any) => setResume((r) => ({ ...r, [key]: value }));
  const updateEntry = (section: 'experience' | 'education', id: string, patch: Partial<Entry>) =>
    setResume((r) => ({
      ...r,
      [section]: r[section].map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  const action = async (name: string, run: () => Promise<void> | void) => {
    setBusy(name);
    setError('');
    try {
      await new Promise((r) => setTimeout(r, 80));
      await run();
      setStatus(`${name} ready`);
    } catch {
      setError(`${name} failed. Your resume is still here. Try again or download a JSON backup.`);
    } finally {
      setBusy('');
    }
  };
  const exportFile = (format: 'PDF' | 'DOCX' | 'LaTeX') =>
    action(format, async () => {
      if (!resume.contact.name.trim()) throw new Error('name');
      if (format === 'LaTeX') {
        const { makeTex } = await import('./latex');
        download(
          new Blob([makeTex(resume)], { type: 'application/x-tex' }),
          `${filename(resume)}.tex`,
        );
        return;
      }
      const lib = await import('./export');
      await (format === 'PDF' ? lib.exportPdf : lib.exportDocx)(resume);
    });
  const requestReplace = (text: string, run: () => void) => setConfirm({ text, run });
  const checks = [
    ['Name', !!resume.contact.name.trim()],
    ['Email or phone', !!(resume.contact.email.trim() || resume.contact.phone.trim())],
    ['Experience or education', !!(resume.experience.length || resume.education.length)],
    ['Skills', !!resume.skills.trim()],
  ] as const;
  const warnings = resume.experience
    .concat(resume.education)
    .filter(
      (e) =>
        e.start &&
        e.end &&
        !e.current &&
        isCanonicalDate(e.start) &&
        isCanonicalDate(e.end) &&
        (e.end.length === 4 ? `${e.end}-12` : e.end) <
          (e.start.length === 4 ? `${e.start}-01` : e.start),
    ).length;
  const restoreRecovery = () => {
    if (!recovery) return;
    try {
      let next: Resume;
      try {
        next = parseResume(JSON.parse(recovery));
      } catch {
        next = salvageResume(JSON.parse(recovery));
      }
      requestReplace(
        'Restore what we could recover from your saved draft? It replaces the resume on screen. Check every section afterwards.',
        () => {
          saveBlocked.current = false;
          setResume(next);
          setStatus('Recovered draft restored');
        },
      );
    } catch {
      setError(
        'The saved data could not be restored automatically. Download it and keep the file; nothing has been deleted.',
      );
    }
  };
  const discardRecovery = () =>
    requestReplace(
      'Discard the recovered data? Download it first if you might need it. This cannot be undone.',
      () => {
        clearRecovery();
        saveBlocked.current = false;
        setRecovery(null);
      },
    );
  const field = (
    label: string,
    value: string,
    onChange: (s: string) => void,
    options: { type?: string; multiline?: boolean; hint?: string; placeholder?: string } = {},
  ) => (
    <label className={options.multiline ? 'field wide' : 'field'}>
      <span>{label}</span>
      {options.multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={options.placeholder}
          rows={5}
          maxLength={20000}
        />
      ) : (
        <input
          type={options.type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={options.placeholder}
          maxLength={20000}
        />
      )}
      {options.hint && <small>{options.hint}</small>}
    </label>
  );
  const entries = (section: 'experience' | 'education') => (
    <>
      <p className="section-note">
        Put the most recent entry first. Use the arrows to change the order.
      </p>
      {resume[section].map((e, i) => (
        <div className="entry" key={e.id}>
          <div className="entry-head">
            <strong>
              {section === 'experience' ? 'Position' : 'Education'} {i + 1}
            </strong>
            <div>
              <button
                aria-label={`Move entry ${i + 1} up`}
                disabled={i === 0}
                onClick={() => {
                  const es = [...resume[section]];
                  [es[i - 1], es[i]] = [es[i], es[i - 1]];
                  change(section, es);
                }}
              >
                ↑
              </button>
              <button
                aria-label={`Move entry ${i + 1} down`}
                disabled={i === resume[section].length - 1}
                onClick={() => {
                  const es = [...resume[section]];
                  [es[i + 1], es[i]] = [es[i], es[i + 1]];
                  change(section, es);
                }}
              >
                ↓
              </button>
              <button
                className="danger-text"
                onClick={() =>
                  requestReplace('Remove this entry? This cannot be undone.', () => {
                    change(
                      section,
                      resume[section].filter((x) => x.id !== e.id),
                    );
                    setStatus('Entry removed');
                  })
                }
              >
                Remove
              </button>
            </div>
          </div>
          <div className="fields">
            {field(
              section === 'experience' ? 'Job title' : 'Degree / qualification',
              e.title,
              (v) => updateEntry(section, e.id, { title: v }),
            )}
            {field(
              section === 'experience' ? 'Employer' : 'School / institution',
              e.organization,
              (v) => updateEntry(section, e.id, { organization: v }),
            )}
            {field('Location', e.location, (v) => updateEntry(section, e.id, { location: v }))}
            <DateField
              label="Start date"
              value={e.start}
              onChange={(v) => updateEntry(section, e.id, { start: v })}
            />
            {!e.current && (
              <DateField
                label="End date"
                value={e.end}
                onChange={(v) => updateEntry(section, e.id, { end: v })}
                onCurrent={() => updateEntry(section, e.id, { current: true, end: '' })}
              />
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={e.current}
                onChange={(ev) => updateEntry(section, e.id, { current: ev.target.checked })}
              />{' '}
              {section === 'experience' ? 'I currently work here' : 'Currently studying'}
            </label>
            {field(
              section === 'experience' ? 'Achievements' : 'Additional details',
              e.details,
              (v) => updateEntry(section, e.id, { details: v }),
              {
                multiline: true,
                hint:
                  section === 'experience'
                    ? 'One bullet per line. Start with an action and include a result when you can.'
                    : 'Honors, relevant coursework, or other details. One item per line.',
              },
            )}
          </div>
        </div>
      ))}
      <button className="add" onClick={() => change(section, [...resume[section], entry()])}>
        + Add {section === 'experience' ? 'experience' : 'education'}
      </button>
    </>
  );
  return (
    <>
      <header>
        <a className="brand" href="./" aria-label="Folio home">
          f<span>o</span>lio<span className="brand-dot">.</span>
        </a>
        <span className="header-tag">A clearer next chapter</span>
        <span role="status" className="save-status">
          <span className="status-dot" />
          {status}
        </span>
      </header>
      <main>
        <div className="intro">
          <div>
            <p className="eyebrow">THE RESUME STUDIO</p>
            <h1>
              Your experience.
              <br />
              <em>Clearly told.</em>
            </h1>
            <p>Make a resume that reads well, for people and software.</p>
          </div>
          <div className="intro-note">
            <span>01 / KEEP IT SIMPLE</span>
            <p>
              One column. Real text.
              <br />
              No clutter in the way.
            </p>
          </div>
        </div>
        <div className="toolbar">
          <div>
            <button
              onClick={() =>
                requestReplace(
                  'Load a fictional example? It replaces your current resume. Download a JSON backup first if you want to keep it.',
                  () => setResume(sample()),
                )
              }
            >
              Load example
            </button>
            <button
              onClick={() =>
                requestReplace(
                  'Start a blank resume? It replaces your current resume. Download a JSON backup first if you want to keep it.',
                  () => setResume(blank()),
                )
              }
            >
              Start fresh
            </button>
          </div>
          <div>
            <button
              disabled={!!busy}
              onClick={() =>
                action('JSON backup', () =>
                  download(
                    new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' }),
                    `${filename(resume)}.json`,
                  ),
                )
              }
            >
              Back up JSON
            </button>
            <button onClick={() => input.current?.click()}>Import JSON</button>
            <input
              ref={input}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  if (file.size > 1_000_000) throw new Error('Choose a backup smaller than 1 MB.');
                  const imported = parseResume(JSON.parse(await file.text()));
                  requestReplace('Replace your current resume with this backup?', () => {
                    setResume(imported);
                    setStatus('Backup imported');
                  });
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Invalid JSON backup.');
                }
              }}
            />
          </div>
        </div>
        <div className="privacy">
          <span>↳</span>
          <p>
            Your resume stays in this browser. No account, no server uploads. Use a JSON backup to
            move between devices. Clearing browser data removes saved work.
          </p>
        </div>
        {recovery && (
          <div className="error recovery" role="alert">
            <p>
              <strong>We couldn't open your saved resume.</strong> Nothing has been deleted: the
              saved data is kept separately in this browser. Download it to keep a copy, or try to
              restore it.
            </p>
            <div className="recovery-actions">
              <button
                onClick={() =>
                  download(
                    new Blob([recovery], { type: 'application/json' }),
                    'Folio-recovered-data.json',
                  )
                }
              >
                Download recovered data
              </button>
              <button className="primary" onClick={restoreRecovery}>
                Try to restore
              </button>
              <button className="danger-text" onClick={discardRecovery}>
                Discard
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
            <button onClick={() => setError('')} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        <div className="mobile-tabs">
          <button aria-pressed={view === 'edit'} onClick={() => setView('edit')}>
            Edit resume
          </button>
          <button aria-pressed={view === 'preview'} onClick={() => setView('preview')}>
            Live preview
          </button>
        </div>
        <div className="workspace">
          <section
            className={`editor ${view === 'preview' ? 'mobile-hidden' : ''}`}
            aria-label="Resume editor"
          >
            <nav aria-label="Resume sections">
              {sections.map((s, i) => (
                <button
                  key={s}
                  aria-current={active === s ? 'step' : undefined}
                  onClick={() => setActive(s)}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {s}
                </button>
              ))}
            </nav>
            <div className="form-panel">
              <div className="section-title">
                <h2>{active}</h2>
                <span>{String(sections.indexOf(active) + 1).padStart(2, '0')} / 06</span>
              </div>
              {active === 'Contact' && (
                <>
                  <p className="section-note">
                    Give recruiters a simple way to reach you. A city is enough; skip your full
                    street address.
                  </p>
                  <div className="fields">
                    {field(
                      'Full name',
                      resume.contact.name,
                      (v) => change('contact', { ...resume.contact, name: v }),
                      { placeholder: 'Your full name' },
                    )}
                    {field(
                      'Professional title',
                      resume.contact.title,
                      (v) => change('contact', { ...resume.contact, title: v }),
                      { placeholder: 'e.g. Operations Coordinator' },
                    )}
                    {field(
                      'Email',
                      resume.contact.email,
                      (v) => change('contact', { ...resume.contact, email: v }),
                      { type: 'email' },
                    )}
                    {field(
                      'Phone',
                      resume.contact.phone,
                      (v) => change('contact', { ...resume.contact, phone: v }),
                      { type: 'tel' },
                    )}
                    {field('City / country', resume.contact.location, (v) =>
                      change('contact', { ...resume.contact, location: v }),
                    )}
                    {field(
                      'Professional links',
                      resume.contact.links,
                      (v) => change('contact', { ...resume.contact, links: v }),
                      {
                        multiline: true,
                        hint: 'LinkedIn, portfolio, or relevant website. One URL per line.',
                      },
                    )}
                  </div>
                </>
              )}
              {active === 'Summary' && (
                <>
                  <p className="section-note">
                    Two or three sentences about your strengths, experience, and the work you want
                    to do. Keep it specific and honest.
                  </p>
                  {field('Professional summary', resume.summary, (v) => change('summary', v), {
                    multiline: true,
                  })}
                </>
              )}
              {active === 'Experience' && entries('experience')}
              {active === 'Education' && entries('education')}
              {active === 'Skills' && (
                <>
                  <p className="section-note">
                    List relevant skills, separated by commas. Use terms from the job description
                    only when they accurately describe your experience.
                  </p>
                  {field('Skills', resume.skills, (v) => change('skills', v), {
                    multiline: true,
                    placeholder: 'e.g. Google Sheets, Data Analysis, Report Writing',
                  })}
                </>
              )}
              {active === 'Certifications' && (
                <>
                  <p className="section-note">
                    Optional. Include the certification, issuer, and year. Leave this blank to hide
                    the section.
                  </p>
                  {field(
                    'Certifications',
                    resume.certifications,
                    (v) => change('certifications', v),
                    { multiline: true, hint: 'One certification per line.' },
                  )}
                </>
              )}
              <div className="form-footer">
                <button
                  disabled={active === 'Contact'}
                  onClick={() => setActive(sections[sections.indexOf(active) - 1])}
                >
                  ← Previous
                </button>
                <button
                  className="primary"
                  onClick={() =>
                    active === 'Certifications'
                      ? setView('preview')
                      : setActive(sections[sections.indexOf(active) + 1])
                  }
                >
                  {active === 'Certifications' ? 'View preview' : 'Next section →'}
                </button>
              </div>
            </div>
            <div className="checklist">
              <h3>Before you send</h3>
              <div>
                {checks.map(([label, ok]) => (
                  <span key={label} className={ok ? 'done' : ''}>
                    {ok ? '✓' : '○'} {label}
                  </span>
                ))}
              </div>
              {warnings > 0 && (
                <p className="danger-text">
                  Check your dates: an end month is earlier than a start month.
                </p>
              )}
              <p>
                These are completeness reminders, not an ATS score. Follow the employer's requested
                file type. No template can guarantee an interview or perfect parsing in every
                system.
              </p>
            </div>
          </section>
          <section
            className={`preview-panel ${view === 'edit' ? 'mobile-hidden' : ''}`}
            aria-label="Resume preview"
          >
            <div className="preview-controls">
              <div>
                <p className="eyebrow">LIVE PREVIEW</p>
                <span>Single-column · Text-based</span>
              </div>
              <label>
                Paper
                <select
                  aria-label="Paper size"
                  value={resume.paper}
                  onChange={(e) => change('paper', e.target.value)}
                >
                  <option value="A4">A4</option>
                  <option value="LETTER">US Letter</option>
                </select>
              </label>
            </div>
            <article
              className="resume-sheet"
              style={{ minHeight: resume.paper === 'A4' ? '790px' : '750px' }}
            >
              {blocks(resume).length ? (
                blocks(resume).map((b, i) =>
                  b.kind === 'name' ? (
                    <h2 key={i} className="r-name">
                      {b.text}
                    </h2>
                  ) : b.kind === 'heading' ? (
                    <h3 key={i} className="r-heading">
                      {b.text}
                    </h3>
                  ) : (
                    <p key={i} className={`r-${b.kind}`}>
                      {b.kind === 'bullet' ? '• ' : ''}
                      {b.text}
                    </p>
                  ),
                )
              ) : (
                <div className="empty-preview">
                  <span>YOUR NEXT CHAPTER</span>
                  <h2>
                    A little detail goes
                    <br />a long way.
                  </h2>
                  <p>
                    Start with your name and contact details, or load the fictional example to
                    explore.
                  </p>
                </div>
              )}
            </article>
            <p className="preview-note">
              Content preview, not exact pagination. PDF and DOCX use the same content; page breaks
              may differ. Review the downloaded file before sending. LaTeX downloads source: compile
              with pdfLaTeX in Overleaf or on your computer.
            </p>
            <div className="download-bar">
              <span>Ready for the next step?</span>
              <div>
                <button
                  className="primary"
                  disabled={!!busy || !resume.contact.name.trim()}
                  onClick={() => exportFile('PDF')}
                >
                  {busy === 'PDF' ? 'Making PDF…' : 'Download PDF'}
                </button>
                <button
                  disabled={!!busy || !resume.contact.name.trim()}
                  onClick={() => exportFile('DOCX')}
                >
                  {busy === 'DOCX' ? 'Making DOCX…' : 'Download DOCX'}
                </button>
                <button
                  disabled={!!busy || !resume.contact.name.trim()}
                  onClick={() => exportFile('LaTeX')}
                >
                  {busy === 'LaTeX' ? 'Making LaTeX…' : 'LaTeX (.tex)'}
                </button>
              </div>
            </div>
            {!resume.contact.name.trim() && (
              <small>Add your name to enable resume downloads.</small>
            )}
          </section>
        </div>
        <footer>
          <span>Folio / Resume builder</span>
          <span>Less decoration. More you.</span>
        </footer>
      </main>
      {busy && (
        <div className="working" role="status">
          <span className="spinner" />
          {busy === 'JSON backup' ? 'Preparing backup…' : `Preparing ${busy}…`}
        </div>
      )}
      {confirm && (
        <div className="modal-backdrop">
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="modal">
            <h2 id="confirm-title">Just checking</h2>
            <p>{confirm.text}</p>
            <div>
              <button autoFocus onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className="primary"
                onClick={() => {
                  confirm.run();
                  setConfirm(null);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
