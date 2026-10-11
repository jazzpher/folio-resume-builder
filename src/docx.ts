import { Document, Packer, Paragraph, TextRun } from 'docx';
import { download } from './download';
import { blocks, filename, type Resume } from './model';

export function makeDocx(r: Resume) {
  return new Document({
    creator: 'Folio',
    title: `${r.contact.name} Resume`,
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 }, paragraph: { spacing: { after: 100 } } },
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
        children: blocks(r).map(
          (b) =>
            new Paragraph({
              keepNext: ['heading', 'role', 'name', 'title'].includes(b.kind),
              spacing: { before: b.kind === 'heading' ? 220 : 0, after: 100 },
              ...(b.kind === 'bullet' ? { bullet: { level: 0 } } : {}),
              children: [
                new TextRun({
                  text: b.text,
                  bold: ['name', 'heading', 'role'].includes(b.kind),
                  size: b.kind === 'name' ? 40 : b.kind === 'heading' ? 26 : 22,
                }),
              ],
            }),
        ),
      },
    ],
  });
}

export async function exportDocx(r: Resume) {
  download(await Packer.toBlob(makeDocx(r)), `${filename(r)}.docx`);
}
