import { useEffect, useId, useState } from 'react';
import { normalizeDate, shortDate } from '../dates';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called when the user types "Present" (or similar) into the field. */
  onCurrent?: () => void;
  /** An extra validation message, e.g. "End date is before the start date." */
  error?: string;
};

/**
 * A plain text date field that accepts "Jan 2024", "2024-01", "01/2024" or "2024".
 * Works the same in every browser, unlike <input type="month">.
 */
export function DateField({ label, value, onChange, onCurrent, error }: Props) {
  const id = useId();
  const [text, setText] = useState(() => shortDate(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(shortDate(value));
  }, [value, focused]);
  const parsed = normalizeDate(text);
  const message = !parsed.valid
    ? 'Use a month and year, like Jan 2024, or just a year.'
    : (error ?? '');
  const invalid = !!message;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
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
          {message}
        </small>
      )}
    </div>
  );
}
