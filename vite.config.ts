import { createRequire } from 'node:module';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);
const KEEP = ['Roboto-Regular.ttf', 'Roboto-Medium.ttf'];

/** Serves a pdfmake vfs containing only the font files the PDF export uses. */
function pdfFonts(): Plugin {
  const id = 'virtual:pdf-fonts';
  return {
    name: 'folio-pdf-fonts',
    resolveId: (source) => (source === id ? `\0${id}` : null),
    load(loaded) {
      if (loaded !== `\0${id}`) return null;
      const mod = require('pdfmake/build/vfs_fonts.js');
      const all: Record<string, string> = mod.pdfMake?.vfs ?? mod.vfs ?? mod;
      const vfs = Object.fromEntries(KEEP.map((k) => [k, all[k]]));
      if (KEEP.some((k) => !vfs[k])) throw new Error('pdfmake vfs_fonts is missing Roboto');
      return `export default ${JSON.stringify(vfs)};`;
    },
  };
}

export default defineConfig({ plugins: [react(), pdfFonts()], base: './' });
