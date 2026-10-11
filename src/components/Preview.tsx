import { blocks, type Resume } from '../model';

export function Preview({ resume }: { resume: Resume }) {
  const items = blocks(resume);
  return (
    <article
      className="resume-sheet"
      style={{ minHeight: resume.paper === 'A4' ? '790px' : '750px' }}
    >
      {items.length ? (
        items.map((b, i) =>
          b.kind === 'name' ? (
            <h2 key={i} className="r-name">
              {b.text}
            </h2>
          ) : b.kind === 'heading' ? (
            <h3 key={i} className="r-heading">
              {b.text}
            </h3>
          ) : b.parts ? (
            <p key={i} className={`r-${b.kind}`}>
              {b.parts.map((p, j) => (
                <span key={j}>
                  {j > 0 && ' | '}
                  {p.href ? (
                    <a href={p.href} target="_blank" rel="noopener noreferrer">
                      {p.text}
                    </a>
                  ) : (
                    p.text
                  )}
                </span>
              ))}
            </p>
          ) : (
            <p key={i} className={`r-${b.kind}`}>
              {b.kind === 'bullet' ? '• ' : ''}
              {b.text}
            </p>
          ),
        )
      ) : (
        <div className="empty-preview">
          <span>YOUR NEXT CHAPTER</span>
          <h2>
            A little detail goes
            <br />a long way.
          </h2>
          <p>Start with your name and contact details, or load the fictional example to explore.</p>
        </div>
      )}
    </article>
  );
}
