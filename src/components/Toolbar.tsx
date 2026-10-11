import { useRef } from 'react';

type Props = {
  busy: boolean;
  onExample: () => void;
  onFresh: () => void;
  onBackup: () => void;
  onImport: (file: File) => void;
};

export function Toolbar({ busy, onExample, onFresh, onBackup, onImport }: Props) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="toolbar">
      <div>
        <button onClick={onExample}>Load example</button>
        <button onClick={onFresh}>Start fresh</button>
      </div>
      <div>
        <button disabled={busy} onClick={onBackup}>
          Back up JSON
        </button>
        <button onClick={() => input.current?.click()}>Import JSON</button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onImport(file);
          }}
        />
      </div>
    </div>
  );
}
