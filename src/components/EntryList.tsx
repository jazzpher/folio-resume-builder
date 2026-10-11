import { entry, type Entry } from '../model';
import { DateField } from './DateField';
import { Field } from './Field';

export type EntryLabels = {
  /** Name of one entry, e.g. "Position". */
  item: string;
  title: string;
  organization?: string;
  location?: string;
  /** Show start/end dates and the "current" checkbox. */
  dates?: boolean;
  /** Show only one date (e.g. an award). */
  singleDate?: string;
  current?: string;
  details?: string;
  detailsHint?: string;
  add: string;
};

type Props = {
  entries: Entry[];
  labels: EntryLabels;
  onChange: (entries: Entry[]) => void;
  onRemove: (entry: Entry, index: number) => void;
};

export function EntryList({ entries, labels, onChange, onRemove }: Props) {
  const update = (id: string, patch: Partial<Entry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const move = (i: number, by: number) => {
    const es = [...entries];
    [es[i + by], es[i]] = [es[i], es[i + by]];
    onChange(es);
  };
  return (
    <>
      <p className="section-note">
        Put the most recent entry first. Use the arrows to change the order.
      </p>
      {entries.map((e, i) => (
        <div className="entry" key={e.id}>
          <div className="entry-head">
            <strong>
              {labels.item} {i + 1}
            </strong>
            <div>
              <button
                aria-label={`Move entry ${i + 1} up`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>
              <button
                aria-label={`Move entry ${i + 1} down`}
                disabled={i === entries.length - 1}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
              <button className="danger-text" onClick={() => onRemove(e, i)}>
                Remove
              </button>
            </div>
          </div>
          <div className="fields">
            <Field
              label={labels.title}
              value={e.title}
              onChange={(v) => update(e.id, { title: v })}
            />
            {labels.organization && (
              <Field
                label={labels.organization}
                value={e.organization}
                onChange={(v) => update(e.id, { organization: v })}
              />
            )}
            {labels.location && (
              <Field
                label={labels.location}
                value={e.location}
                onChange={(v) => update(e.id, { location: v })}
              />
            )}
            {labels.singleDate && (
              <DateField
                label={labels.singleDate}
                value={e.start}
                onChange={(v) => update(e.id, { start: v })}
              />
            )}
            {labels.dates && (
              <>
                <DateField
                  label="Start date"
                  value={e.start}
                  onChange={(v) => update(e.id, { start: v })}
                />
                {!e.current && (
                  <DateField
                    label="End date"
                    value={e.end}
                    onChange={(v) => update(e.id, { end: v })}
                    onCurrent={() => update(e.id, { current: true, end: '' })}
                  />
                )}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={e.current}
                    onChange={(ev) => update(e.id, { current: ev.target.checked })}
                  />{' '}
                  {labels.current ?? 'Ongoing'}
                </label>
              </>
            )}
            {labels.details && (
              <Field
                label={labels.details}
                value={e.details}
                onChange={(v) => update(e.id, { details: v })}
                multiline
                hint={labels.detailsHint}
              />
            )}
          </div>
        </div>
      ))}
      <button className="add" onClick={() => onChange([...entries, entry()])}>
        {labels.add}
      </button>
    </>
  );
}
