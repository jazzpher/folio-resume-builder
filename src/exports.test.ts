import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { makeDocx } from './docx';
import { makePdf } from './pdf';
import { blocks, hrefFor, lines, sample } from './model';

describe('links', () => {
  it('makes safe link targets only', () => {
    expect(hrefFor('alex@example.com', 'email')).toBe('mailto:alex@example.com');
    expect(hrefFor('+63 917 000 1234', 'phone')).toBe('tel:+639170001234');
    expect(hrefFor('linkedin.com/in/alex', 'url')).toBe('https://linkedin.com/in/alex');
    expect(hrefFor('https://alex.dev/work', 'url')).toBe('https://alex.dev/work');
    expect(hrefFor('javascript:alert(1)', 'url')).toBeUndefined();
    expect(hrefFor('not an email', 'email')).toBeUndefined();
    expect(hrefFor('GitHub: alexr', 'url')).toBeUndefined();
  });
  it('marks contact parts with links', () => {
    const contact = blocks(sample()).filter((b) => b.kind === 'contact');
    expect(contact[0].parts?.[0]).toEqual({
      text: 'alex.rivera@example.com',
      href: 'mailto:alex.rivera@example.com',
    });
    expect(contact[0].parts?.[2]).toEqual({ text: 'Quezon City, Philippines' });
    expect(contact[1].parts?.[0].href).toBe('https://linkedin.com/in/alex-rivera');
  });
  it('strips common bullet characters', () => {
    expect(lines('- a\n• b\n* c\n– d\n— e\nf')).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });
});

describe('PDF document', () => {
  it('sets metadata, links and real bullet lists', () => {
    const doc = makePdf(sample());
    expect(doc.info).toMatchObject({ title: 'Alex Rivera Resume', author: 'Alex Rivera' });
    const content = doc.content as any[];
    const lists = content.filter((c) => c.ul);
    expect(lists.length).toBe(3); // two jobs + one project
    expect(lists[0].ul).toHaveLength(3);
    expect(JSON.stringify(content)).toContain('"link":"mailto:alex.rivera@example.com"');
  });
});

describe('DOCX document', () => {
  it('uses heading styles and hyperlinks', async () => {
    const buf = await Packer.toBuffer(makeDocx(sample()));
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('w:val="Title"');
    expect(xml).toContain('w:val="Heading1"');
    expect(xml).toContain('w:val="Heading2"');
    expect(xml).toContain('<w:hyperlink');
    const rels = await zip.file('word/_rels/document.xml.rels')!.async('string');
    expect(rels).toContain('mailto:alex.rivera@example.com');
  });
});
