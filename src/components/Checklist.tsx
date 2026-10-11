import { isCanonicalDate } from '../dates';
import type { Entry, Resume } from '../model';
import { nonempty } from '../model';

const endKey = (s: string) => (s.length === 4 ? `${s}-12` : s);
const startKey = (s: string) => (s.length === 4 ? `${s}-01` : s);
export const datesOutOfOrder = (e: Entry) =>
  !!e.start &&
  !!e.end &&
  !e.current &&
  isCanonicalDate(e.start) &&
  isCanonicalDate(e.end) &&
  endKey(e.end) < startKey(e.start);

export function Checklist({ resume }: { resume: Resume }) {
  const checks = [
    ['Name', !!resume.contact.name.trim()],
    ['Email or phone', !!(resume.contact.email.trim() || resume.contact.phone.trim())],
    [
      'Experience or education',
      resume.experience.some(nonempty) || resume.education.some(nonempty),
    ],
    ['Skills', !!resume.skills.trim()],
  ] as const;
  const warnings = resume.experience.concat(resume.education).filter(datesOutOfOrder).length;
  return (
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
        <p className="danger-text">Check your dates: an end date is earlier than a start date.</p>
      )}
      <p>
        These are completeness reminders, not an ATS score. Follow the employer's requested file
        type. No template can guarantee an interview or perfect parsing in every system.
      </p>
    </div>
  );
}
