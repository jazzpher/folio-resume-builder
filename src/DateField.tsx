import { useEffect, useId, useState } from 'react';
import { normalizeDate, shortDate } from './dates';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called when the user types "Present" (or similar) into the field. */
  onCurrent?: () => void;
};

/**
 * A plain text date field that accepts "Jan 2024", "2024-01", "01/2024" or "2024".
 * Works the same in every browser, unlike <input type="month">.
 */
export function DateField({ label, value, onChange, onCurrent }: Props) {
  const id = useId();
  const [text, setText] = useState(() => shortDate(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(shortDate(value));
  }, [value, focused]);
  const parsed = normalizeDate(text);
  const invalid = !parsed.valid;
  const errorId = `${id}-error`;
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        value={text}
        placeholder="e.g. Jan 2024"
        maxLength={40}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          const p = normalizeDate(next);
          if (p.current && onCurrent) return;
          onChange(p.valid ? p.value : next.trim());
        }}
        onBlur={() => {
          setFocused(false);
          const p = normalizeDate(text);
          if (p.current && onCurrent) {
            onCurrent();
            setText('');
            return;
          }
          setText(shortDate(p.value));
        }}
      />
      {invalid && (
        <small id={errorId} className="field-error">
          Use a month and year, like Jan 2024, or just a year.
        </small>
      )}
    </label>
  );
}
