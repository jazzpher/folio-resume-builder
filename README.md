# Folio - ATS-friendly resume builder

A browser-local resume studio for job applications. Live preview, editable and reorderable experience/education entries, A4/US Letter paper, downloadable text-based PDF, editable Word DOCX, and LaTeX source.

## Privacy and storage

No login, database, analytics, AI API, or resume upload. Editing happens in your browser. Autosave uses localStorage on the current device/browser. Clearing site data removes the draft; private browsing may not persist it. Use **Back up JSON** and **Import JSON** to keep a copy or transfer between devices. Shared devices can retain your draft, so clear it after backing up.

The fictional example is not a real person's resume. The app starts blank and never inserts personal user data into the repository.

## Downloads

- PDF: selectable text, single-column reading order, embedded fonts, automatic pagination.
- DOCX: editable paragraphs and bullets, no layout tables, textboxes or header/footer contact details.
- LaTeX (.tex): source file, not a compiled PDF. Compile with **pdfLaTeX**, for example in Overleaf. Standard sections, escaped special characters, one column. pdfLaTeX supports common Latin characters but not every Unicode script; use the PDF/DOCX exports for scripts unsupported by your LaTeX installation.
- JSON: validated editable backup. Import asks before replacing the current draft.

The on-screen preview shows content and layout, not exact export pagination. Always review the downloaded file before applying. Follow the employer's required format. No builder can guarantee ATS parsing, match scores, interviews, or hiring outcomes. Tailor the resume using truthful skills and results, and put recent entries first.

## Development

```sh
npm ci
npm run dev
npm run check          # format:check + lint + typecheck + unit tests
npm run test:coverage
npx playwright install chromium firefox webkit
npm run test:e2e       # desktop + mobile Chromium, Firefox, WebKit
npm run build
```

Node 22+. Vite uses relative asset paths for GitHub Pages project URLs. Document libraries are lazy-loaded for downloads, keeping the initial page small. All dependencies are bundled: no external font/CDN runtime requests.

## Deployment

App changes go through a feature branch and PR. After approval and merge, `ci.yml` deploys `dist` to GitHub Pages, but only after formatting, lint, typecheck, unit tests, `npm audit`, the build and the e2e suite in Chromium (desktop + mobile), Firefox and WebKit have all passed. Repository Settings > Pages > Build and deployment must use **GitHub Actions**. Dependabot opens grouped weekly npm and monthly Actions updates.

## Design basis

- [Harvard resume guide](https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/): specific, fact-based wording, consistent headings, most recent experience first.
- [Jobscan ATS format checklist](https://www.jobscan.co/blog/20-ats-friendly-resume-templates/): text-based PDF/DOCX, conventional sections, readable fonts, no columns, tables, graphics or vital details in headers/footers.
