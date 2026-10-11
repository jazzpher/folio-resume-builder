import { SECTION_KINDS, section, type Entry, type Section, type SectionKind } from '../model';
import { SECTION_LABELS } from '../sections';
import { EntryList } from './EntryList';
import { Field } from './Field';

type Props = {
  sections: Section[];
  onChange: (sections: Section[]) => void;
  onRemoveSection: (s: Section) => void;
  onRemoveEntry: (s: Section, e: Entry) => void;
};

export function SectionsEditor({ sections, onChange, onRemoveSection, onRemoveEntry }: Props) {
  const update = (id: string, patch: Partial<Section>) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const move = (i: number, by: number) => {
    const next = [...sections];
    [next[i + by], next[i]] = [next[i], next[i + by]];
    onChange(next);
  };
  const add = (kind: SectionKind) => onChange([...sections, section(kind)]);
  return (
    <>
      <p className="section-note">
        Optional sections such as projects, languages, awards or volunteering. They appear after
        Certifications, in this order. Empty sections are hidden.
      </p>
      {sections.map((s, i) => (
        <div className="extra-section" key={s.id}>
          <div className="entry-head">
            <strong>{SECTION_LABELS[s.kind].name}</strong>
            <div>
              <button
                aria-label={`Move section ${s.heading || i + 1} up`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>
              <button
                aria-label={`Move section ${s.heading || i + 1} down`}
                disabled={i === sections.length - 1}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
              <button className="danger-text" onClick={() => onRemoveSection(s)}>
                Remove section
              </button>
            </div>
          </div>
          <div className="fields">
            <Field
              label="Section heading"
              value={s.heading}
              onChange={(v) => update(s.id, { heading: v })}
            />
          </div>
          <EntryList
            entries={s.entries}
            labels={SECTION_LABELS[s.kind].labels}
            onChange={(entries) => update(s.id, { entries })}
            onRemove={(e) => onRemoveEntry(s, e)}
          />
        </div>
      ))}
      <div className="add-section" role="group" aria-label="Add a section">
        <span>Add a section</span>
        {SECTION_KINDS.map((k) => (
          <button key={k} onClick={() => add(k)}>
            + {SECTION_LABELS[k].name}
          </button>
        ))}
      </div>
    </>
  );
}
