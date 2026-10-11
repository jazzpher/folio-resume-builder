import { useEffect, useRef, useState } from 'react';
import { Checklist } from './components/Checklist';
import { ConfirmDialog, type Confirm } from './components/ConfirmDialog';
import { DownloadBar, type Format } from './components/DownloadBar';
import { EntryList, type EntryLabels } from './components/EntryList';
import { Field } from './components/Field';
import { Preview } from './components/Preview';
import { SectionsEditor } from './components/SectionsEditor';
import { RecoveryBanner } from './components/RecoveryBanner';
import { Toolbar } from './components/Toolbar';
import { download } from './download';
import { blank, filename, parseResume, salvageResume, sample, type Resume } from './model';
import { KEY, clearRecovery, loadDraft } from './storage';

const STEPS = [
  'Contact',
  'Summary',
  'Experience',
  'Education',
  'Skills',
  'Certifications',
  'More sections',
];

const EXPERIENCE: EntryLabels = {
  item: 'Position',
  title: 'Job title',
  organization: 'Employer',
  location: 'Location',
  dates: true,
  current: 'I currently work here',
  details: 'Achievements',
  detailsHint: 'One bullet per line. Start with an action and include a result when you can.',
  add: '+ Add experience',
};
const EDUCATION: EntryLabels = {
  item: 'Education',
  title: 'Degree / qualification',
  organization: 'School / institution',
  location: 'Location',
  dates: true,
  current: 'Currently studying',
  details: 'Additional details',
  detailsHint: 'Honors, relevant coursework, or other details. One item per line.',
  add: '+ Add education',
};

export function App() {
  const [loaded] = useState(loadDraft);
  const [resume, setResume] = useState<Resume>(loaded.resume);
  const [recovery, setRecovery] = useState<string | null>(loaded.recovery);
  const saveBlocked = useRef(loaded.saveBlocked);
  const [active, setActive] = useState('Contact');
  const [view, setView] = useState('edit');
  const [status, setStatus] = useState('Ready to edit');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState<Confirm | null>(null);
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

  const change = <K extends keyof Resume>(key: K, value: Resume[K]) =>
    setResume((r) => ({ ...r, [key]: value }));
  const setContact = (key: keyof Resume['contact']) => (value: string) =>
    setResume((r) => ({ ...r, contact: { ...r.contact, [key]: value } }));
  const requestReplace = (text: string, run: () => void) => setConfirm({ text, run });

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
  const exportFile = (format: Format) =>
    action(format, async () => {
      if (!resume.contact.name.trim()) throw new Error('name');
      if (format === 'LaTeX') {
        const { makeTex } = await import('./latex');
        download(
          new Blob([makeTex(resume)], { type: 'application/x-tex' }),
          `${filename(resume)}.tex`,
        );
      } else if (format === 'PDF') await (await import('./pdf')).exportPdf(resume);
      else await (await import('./docx')).exportDocx(resume);
    });
  const importFile = async (file: File) => {
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
  };
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
  const removeFrom = (section: 'experience' | 'education') => (e: { id: string }) =>
    requestReplace('Remove this entry? This cannot be undone.', () => {
      setResume((r) => ({ ...r, [section]: r[section].filter((x) => x.id !== e.id) }));
      setStatus('Entry removed');
    });

  const removeSection = (s: { id: string }) =>
    requestReplace('Remove this section and everything in it? This cannot be undone.', () => {
      setResume((r) => ({ ...r, sections: r.sections.filter((x) => x.id !== s.id) }));
      setStatus('Section removed');
    });
  const removeSectionEntry = (s: { id: string }, e: { id: string }) =>
    requestReplace('Remove this entry? This cannot be undone.', () => {
      setResume((r) => ({
        ...r,
        sections: r.sections.map((x) =>
          x.id === s.id ? { ...x, entries: x.entries.filter((y) => y.id !== e.id) } : x,
        ),
      }));
      setStatus('Entry removed');
    });
  const stepIndex = STEPS.indexOf(active);
  const last = stepIndex === STEPS.length - 1;

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
        <Toolbar
          busy={!!busy}
          onExample={() =>
            requestReplace(
              'Load a fictional example? It replaces your current resume. Download a JSON backup first if you want to keep it.',
              () => setResume(sample()),
            )
          }
          onFresh={() =>
            requestReplace(
              'Start a blank resume? It replaces your current resume. Download a JSON backup first if you want to keep it.',
              () => setResume(blank()),
            )
          }
          onBackup={() =>
            action('JSON backup', () =>
              download(
                new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' }),
                `${filename(resume)}.json`,
              ),
            )
          }
          onImport={importFile}
        />
        <div className="privacy">
          <span>↳</span>
          <p>
            Your resume stays in this browser. No account, no server uploads. Use a JSON backup to
            move between devices. Clearing browser data removes saved work.
          </p>
        </div>
        {recovery && (
          <RecoveryBanner data={recovery} onRestore={restoreRecovery} onDiscard={discardRecovery} />
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
              {STEPS.map((s, i) => (
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
                <span>
                  {String(stepIndex + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
                </span>
              </div>
              {active === 'Contact' && (
                <>
                  <p className="section-note">
                    Give recruiters a simple way to reach you. A city is enough; skip your full
                    street address.
                  </p>
                  <div className="fields">
                    <Field
                      label="Full name"
                      value={resume.contact.name}
                      onChange={setContact('name')}
                      placeholder="Your full name"
                    />
                    <Field
                      label="Professional title"
                      value={resume.contact.title}
                      onChange={setContact('title')}
                      placeholder="e.g. Operations Coordinator"
                    />
                    <Field
                      label="Email"
                      type="email"
                      value={resume.contact.email}
                      onChange={setContact('email')}
                    />
                    <Field
                      label="Phone"
                      type="tel"
                      value={resume.contact.phone}
                      onChange={setContact('phone')}
                    />
                    <Field
                      label="City / country"
                      value={resume.contact.location}
                      onChange={setContact('location')}
                    />
                    <Field
                      label="Professional links"
                      value={resume.contact.links}
                      onChange={setContact('links')}
                      multiline
                      hint="LinkedIn, portfolio, or relevant website. One URL per line."
                    />
                  </div>
                </>
              )}
              {active === 'Summary' && (
                <>
                  <p className="section-note">
                    Two or three sentences about your strengths, experience, and the work you want
                    to do. Keep it specific and honest.
                  </p>
                  <Field
                    label="Professional summary"
                    value={resume.summary}
                    onChange={(v) => change('summary', v)}
                    multiline
                  />
                </>
              )}
              {active === 'Experience' && (
                <EntryList
                  entries={resume.experience}
                  labels={EXPERIENCE}
                  onChange={(es) => change('experience', es)}
                  onRemove={removeFrom('experience')}
                />
              )}
              {active === 'Education' && (
                <EntryList
                  entries={resume.education}
                  labels={EDUCATION}
                  onChange={(es) => change('education', es)}
                  onRemove={removeFrom('education')}
                />
              )}
              {active === 'Skills' && (
                <>
                  <p className="section-note">
                    List relevant skills, separated by commas. Use terms from the job description
                    only when they accurately describe your experience.
                  </p>
                  <Field
                    label="Skills"
                    value={resume.skills}
                    onChange={(v) => change('skills', v)}
                    multiline
                    placeholder="e.g. Google Sheets, Data Analysis, Report Writing"
                  />
                </>
              )}
              {active === 'Certifications' && (
                <>
                  <p className="section-note">
                    Optional. Include the certification, issuer, and year. Leave this blank to hide
                    the section.
                  </p>
                  <Field
                    label="Certifications"
                    value={resume.certifications}
                    onChange={(v) => change('certifications', v)}
                    multiline
                    hint="One certification per line."
                  />
                </>
              )}
              {active === 'More sections' && (
                <SectionsEditor
                  sections={resume.sections}
                  onChange={(next) => change('sections', next)}
                  onRemoveSection={removeSection}
                  onRemoveEntry={removeSectionEntry}
                />
              )}
              <div className="form-footer">
                <button disabled={stepIndex === 0} onClick={() => setActive(STEPS[stepIndex - 1])}>
                  ← Previous
                </button>
                <button
                  className="primary"
                  onClick={() => (last ? setView('preview') : setActive(STEPS[stepIndex + 1]))}
                >
                  {last ? 'View preview' : 'Next section →'}
                </button>
              </div>
            </div>
            <Checklist resume={resume} />
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
                  onChange={(e) => change('paper', e.target.value as Resume['paper'])}
                >
                  <option value="A4">A4</option>
                  <option value="LETTER">US Letter</option>
                </select>
              </label>
            </div>
            <Preview resume={resume} />
            <p className="preview-note">
              Content preview, not exact pagination. PDF and DOCX use the same content; page breaks
              may differ. Review the downloaded file before sending. LaTeX downloads source: compile
              with pdfLaTeX in Overleaf or on your computer.
            </p>
            <DownloadBar busy={busy} disabled={!resume.contact.name.trim()} onExport={exportFile} />
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
      {confirm && <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />}
    </>
  );
}
