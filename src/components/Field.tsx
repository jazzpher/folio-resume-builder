import { useId } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  hint?: string;
  placeholder?: string;
  /** Validation message; marks the control aria-invalid and links it with aria-describedby. */
  error?: string;
};

export function Field({
  label,
  value,
  onChange,
  type,
  multiline,
  hint,
  placeholder,
  error,
}: Props) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  const common = {
    value,
    placeholder,
    maxLength: 20000,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  } as const;
  return (
    <label className={multiline ? 'field wide' : 'field'}>
      <span>{label}</span>
      {multiline ? (
        <textarea {...common} rows={5} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type || 'text'} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && (
        <small id={errorId} className="field-error">
          {error}
        </small>
      )}
      {hint && <small id={hintId}>{hint}</small>}
    </label>
  );
}
