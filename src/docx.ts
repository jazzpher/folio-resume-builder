import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  type ParagraphChild,
} from 'docx';
import { download } from './download';
import { blocks, filename, type Block, type Resume } from './model';

const HEADING: Partial<Record<Block['kind'], (typeof HeadingLevel)[keyof typeof HeadingLevel]>> = {
  name: HeadingLevel.TITLE,
  heading: HeadingLevel.HEADING_1,
  role: HeadingLevel.HEADING_2,
};

// Headings keep the plain resume look (Arial, black) while carrying real Word heading
// styles, so screen readers, the navigation pane and ATS parsers see the structure.
const headingStyle = (size: number, before = 0) => ({
  run: { font: 'Arial', size, bold: true, color: '000000' },
  paragraph: { spacing: { before, after: 100 }, keepNext: true },
});

function children(b: Block): ParagraphChild[] {
  if (!b.parts) return [new TextRun({ text: b.text })];
  return b.parts.flatMap((p, i) => {
    const sep = i ? [new TextRun({ text: ' | ' })] : [];
    const run = p.href
      ? new ExternalHyperlink({
          link: p.href,
          children: [new TextRun({ text: p.text, style: 'Hyperlink' })],
        })
      : new TextRun({ text: p.text });
    return [...sep, run];
  });
}

export function makeDocx(r: Resume) {
  return new Document({
    creator: 'Folio',
    title: `${r.contact.name} Resume`,
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 }, paragraph: { spacing: { after: 100 } } },
        title: headingStyle(40),
        heading1: headingStyle(26, 220),
        heading2: headingStyle(22),
        hyperlink: { run: { color: '1F4E79', underline: {} } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size:
              r.paper === 'A4' ? { width: 11906, height: 16838 } : { width: 12240, height: 15840 },
            margin: { top: 1008, bottom: 1008, left: 1008, right: 1008 },
          },
        },
        children: blocks(r).map((b) =>
          HEADING[b.kind]
            ? new Paragraph({ heading: HEADING[b.kind], children: children(b) })
            : new Paragraph({
                keepNext: b.kind === 'title',
                spacing: { after: 100 },
                ...(b.kind === 'bullet' ? { bullet: { level: 0 } } : {}),
                children: children(b),
              }),
        ),
      },
    ],
  });
}

export async function exportDocx(r: Resume) {
  download(await Packer.toBlob(makeDocx(r)), `${filename(r)}.docx`);
}
