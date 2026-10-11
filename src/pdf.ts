import pdfMake from 'pdfmake/build/pdfmake';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
// Only Roboto Regular + Medium (bold) are bundled, via a build-time virtual module
// (see vite.config.ts). Italic faces are never used, which saves ~430 kB of font data.
import vfs from 'virtual:pdf-fonts';
import { blocks, filename, type Block, type Resume } from './model';

pdfMake.vfs = vfs;
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Regular.ttf',
    bolditalics: 'Roboto-Medium.ttf',
  },
};

const LINK = '#1f4e79';

function text(b: Block): Content {
  const style = {
    fontSize: b.kind === 'name' ? 20 : b.kind === 'heading' ? 13 : 11,
    bold: ['name', 'heading', 'role'].includes(b.kind),
    margin: [0, b.kind === 'heading' ? 12 : 0, 0, 5] as [number, number, number, number],
    ...(b.kind === 'heading' ? { headlineLevel: 1 } : {}),
  };
  if (!b.parts) return { text: b.text, ...style };
  return {
    text: b.parts.flatMap((p, i) => [
      ...(i ? [' | '] : []),
      p.href ? { text: p.text, link: p.href, color: LINK } : p.text,
    ]),
    ...style,
  };
}

export function makePdf(r: Resume): TDocumentDefinitions {
  const content: Content[] = [];
  let list: string[] | null = null;
  for (const b of blocks(r)) {
    if (b.kind === 'bullet') {
      if (!list) {
        list = [];
        // A real list: wrapped lines get a hanging indent under the bullet.
        content.push({ ul: list, margin: [0, 0, 0, 5], markerColor: '#251f21' });
      }
      list.push(b.text);
      continue;
    }
    list = null;
    content.push(text(b));
  }
  const name = r.contact.name.trim();
  return {
    info: { title: `${name} Resume`, author: name, creator: 'Folio', subject: 'Resume' },
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
