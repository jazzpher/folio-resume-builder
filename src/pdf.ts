import pdfMake from 'pdfmake/build/pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
// Only Roboto Regular + Medium (bold) are bundled, via a build-time virtual module
// (see vite.config.ts). Italic faces are never used, which saves ~430 kB of font data.
import vfs from 'virtual:pdf-fonts';
import { blocks, filename, type Resume } from './model';

pdfMake.vfs = vfs;
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Regular.ttf',
    bolditalics: 'Roboto-Medium.ttf',
  },
};

export function makePdf(r: Resume): TDocumentDefinitions {
  const content = blocks(r).map((b) => ({
    text: b.kind === 'bullet' ? `• ${b.text}` : b.text,
    fontSize: b.kind === 'name' ? 20 : b.kind === 'heading' ? 13 : 11,
    bold: ['name', 'heading', 'role'].includes(b.kind),
    margin: [0, b.kind === 'heading' ? 12 : 0, 0, 5] as [number, number, number, number],
    ...(b.kind === 'heading' ? { headlineLevel: 1 } : {}),
  }));
  return {
    pageSize: r.paper,
    pageMargins: [50, 50, 50, 50],
    defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.18 },
    content,
    pageBreakBefore: (node, following) => node.headlineLevel === 1 && following.length === 0,
  };
}

export async function exportPdf(r: Resume) {
  pdfMake.createPdf(makePdf(r)).download(`${filename(r)}.pdf`);
}
