export type Format = 'PDF' | 'DOCX' | 'LaTeX';

type Props = { busy: string; disabled: boolean; onExport: (format: Format) => void };

export function DownloadBar({ busy, disabled, onExport }: Props) {
  const button = (format: Format, idle: string, primary = false) => (
    <button
      className={primary ? 'primary' : undefined}
      disabled={!!busy || disabled}
      onClick={() => onExport(format)}
    >
      {busy === format ? `Making ${format}…` : idle}
    </button>
  );
  return (
    <>
      <div className="download-bar">
        <span>Ready for the next step?</span>
        <div>
          {button('PDF', 'Download PDF', true)}
          {button('DOCX', 'Download DOCX')}
          {button('LaTeX', 'LaTeX (.tex)')}
        </div>
      </div>
      {disabled && <small>Add your name to enable resume downloads.</small>}
    </>
  );
}
