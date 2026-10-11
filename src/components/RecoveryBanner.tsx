import { download } from '../download';

type Props = { data: string; onRestore: () => void; onDiscard: () => void };

export function RecoveryBanner({ data, onRestore, onDiscard }: Props) {
  return (
    <div className="error recovery" role="alert">
      <p>
        <strong>We couldn't open your saved resume.</strong> Nothing has been deleted: the saved
        data is kept separately in this browser. Download it to keep a copy, or try to restore it.
      </p>
      <div className="recovery-actions">
        <button
          onClick={() =>
            download(new Blob([data], { type: 'application/json' }), 'Folio-recovered-data.json')
          }
        >
          Download recovered data
        </button>
        <button className="primary" onClick={onRestore}>
          Try to restore
        </button>
        <button className="danger-text" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}
