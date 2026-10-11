import { test, expect } from '@playwright/test';
import fs from 'node:fs';
async function example(page: any) {
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
async function preview(page: any) {
  if (await page.getByRole('button', { name: 'Live preview', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Live preview', exact: true }).click();
}
test('edit, save, reload, preview and no horizontal overflow', async ({ page }, info) => {
  await page.goto('/');
  await page.getByLabel('Full name', { exact: true }).fill('Maria Santos');
  await expect(page.getByRole('status').first()).toContainText('Saved on this browser');
  await page.reload();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Maria Santos');
  await preview(page);
  await expect(page.getByRole('heading', { name: 'Maria Santos' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: `/tmp/folio-${info.project.name}.png`, fullPage: true });
});
test('example, entry add/remove/reorder, JSON, PDF, DOCX and LaTeX downloads', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await example(page);
  await page.getByRole('button', { name: /03.*Experience/ }).click();
  await page.getByRole('button', { name: '+ Add experience' }).click();
  await expect(page.getByText('Position 3', { exact: true })).toBeVisible();
  await page.getByLabel('Move entry 2 up').click();
  await expect(page.getByLabel('Job title').first()).toHaveValue('Administrative Assistant');
  await page.getByRole('button', { name: 'Remove', exact: true }).last().click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText('Position 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove', exact: true }).last().click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Position 3', { exact: true })).toHaveCount(0);
  const jsonPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up JSON' }).click();
  const json = await jsonPromise;
  const jsonPath = `/tmp/folio-${info.project.name}.json`;
  await json.saveAs(jsonPath);
  expect(JSON.parse(fs.readFileSync(jsonPath, 'utf8')).contact.name).toBe('Alex Rivera');
  await preview(page);
  for (const [label, ext] of [
    ['Download PDF', 'pdf'],
    ['Download DOCX', 'docx'],
    ['LaTeX (.tex)', 'tex'],
  ]) {
    const dp = page.waitForEvent('download');
    await page.getByRole('button', { name: label, exact: true }).click();
    const d = await dp;
    await d.saveAs(`/tmp/folio-${info.project.name}.${ext}`);
    expect(fs.statSync(`/tmp/folio-${info.project.name}.${ext}`).size).toBeGreaterThan(500);
  }
  await page.screenshot({ path: `/tmp/folio-example-${info.project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});
test('invalid import cannot overwrite current content', async ({ page }) => {
  await page.goto('/');
  await example(page);
  await page.locator('input[type=file]').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":9}'),
  });
  await expect(page.getByRole('alert')).toContainText('not supported');
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Alex Rivera');
});
test('valid import, cancel replacement, and reset confirmation', async ({ page }) => {
  await page.goto('/');
  await example(page);
  await expect(page.getByRole('status').first()).toContainText('Saved on this browser');
  const backup = await page.evaluate(() => localStorage.getItem('folio-resume-v2'));
  await page.getByRole('button', { name: 'Start fresh' }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Alex Rivera');
  await page.getByRole('button', { name: 'Start fresh' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('');
  await page.locator('input[type=file]').setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup!),
  });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Alex Rivera');
});
test('storage errors remain visible and do not stop editing', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
  });
  await page.goto('/');
  await page.getByLabel('Full name', { exact: true }).fill('Private Draft');
  await expect(page.getByRole('alert')).toContainText('storage is unavailable');
  await preview(page);
  await expect(page.getByRole('heading', { name: 'Private Draft' })).toBeVisible();
});
test('small screen has no overflow and inputs use 16px text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await example(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page
      .getByLabel('Full name', { exact: true })
      .evaluate((e) => getComputedStyle(e).fontSize),
  ).toBe('16px');
  await preview(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a saved draft with free-text dates is kept, not wiped', async ({ page }) => {
  await page.goto('/');
  await example(page);
  await expect(page.getByRole('status').first()).toContainText('Saved on this browser');
  await page.evaluate(() => {
    const r = JSON.parse(localStorage.getItem('folio-resume-v2')!);
    r.experience[0].start = 'Jan 2024';
    r.experience[0].current = false;
    r.experience[0].end = 'Present';
    localStorage.setItem('folio-resume-v2', JSON.stringify(r));
  });
  await page.reload();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Alex Rivera');
  await page.getByRole('button', { name: /03.*Experience/ }).click();
  await expect(page.getByLabel('Start date').first()).toHaveValue('Jan 2024');
  await expect(page.getByLabel('I currently work here').first()).toBeChecked();
  await preview(page);
  await expect(page.getByText('January 2024 - Present')).toBeVisible();
});

test('unreadable saved data is stashed and can be downloaded or restored', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(
      'folio-resume-v2',
      JSON.stringify({
        version: 7,
        contact: { name: 'Kept Person', email: 'kept@example.com' },
        experience: [{ title: 'Kept Job', start: 'Jan 2024' }],
      }),
    );
  });
  await page.goto('/');
  const banner = page.getByRole('alert').filter({ hasText: "couldn't open your saved resume" });
  await expect(banner).toBeVisible();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('');
  // Typing must not destroy the stashed copy.
  await page.getByLabel('Full name', { exact: true }).fill('Someone Else');
  await expect(page.getByRole('status').first()).toContainText('Saved on this browser');
  const dl = page.waitForEvent('download');
  await banner.getByRole('button', { name: 'Download recovered data' }).click();
  const file = await dl;
  const path = await file.path();
  expect(fs.readFileSync(path!, 'utf8')).toContain('Kept Person');
  await page.reload();
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: 'Try to restore' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Kept Person');
  await page.getByRole('button', { name: /03.*Experience/ }).click();
  await expect(page.getByLabel('Job title').first()).toHaveValue('Kept Job');
  await expect(page.getByLabel('Start date').first()).toHaveValue('Jan 2024');
});

test('date fields accept typed dates and flag ones they cannot read', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /03.*Experience/ }).click();
  await page.getByRole('button', { name: '+ Add experience' }).click();
  await page.getByLabel('Job title').fill('Analyst');
  const start = page.getByLabel('Start date');
  await start.fill('3/2022');
  await start.blur();
  await expect(start).toHaveValue('Mar 2022');
  const end = page.getByLabel('End date');
  await end.fill('Spring 2023');
  await expect(end).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Use a month and year')).toBeVisible();
  await end.fill('present');
  await end.blur();
  await expect(page.getByLabel('I currently work here')).toBeChecked();
});

test('a version 1 draft migrates and extra sections reach the preview', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(
      'folio-resume-v1',
      JSON.stringify({
        version: 1,
        contact: {
          name: 'Old Draft',
          title: '',
          email: 'old@example.com',
          phone: '',
          location: '',
          links: '',
        },
        summary: 'Kept summary',
        experience: [],
        education: [],
        skills: 'Excel',
        certifications: '',
        paper: 'A4',
      }),
    );
  });
  await page.goto('/');
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Old Draft');
  await page.getByRole('button', { name: /07.*More sections/ }).click();
  await page.getByRole('button', { name: '+ Projects' }).click();
  await page.getByLabel('Project name').fill('Inventory Dashboard');
  await page.getByLabel('What you did').fill('Built a stock dashboard in Sheets');
  await page.getByRole('button', { name: '+ Languages' }).click();
  await page.getByLabel('Language', { exact: true }).fill('Cebuano');
  await expect(page.getByRole('status').first()).toContainText('Saved on this browser');
  await page.reload();
  await preview(page);
  const sheet = page.locator('.resume-sheet');
  await expect(sheet.getByRole('heading', { name: 'Projects' })).toBeVisible();
  await expect(sheet.getByText('Inventory Dashboard')).toBeVisible();
  await expect(sheet.getByText('• Built a stock dashboard in Sheets')).toBeVisible();
  await expect(sheet.getByText('Cebuano', { exact: true })).toBeVisible();
  await expect(sheet.getByText('Kept summary')).toBeVisible();
});

test('confirm dialog is modal, closes with Escape and returns focus', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Load example' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Just checking' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('');
});

test('field errors are tied to their inputs', async ({ page }) => {
  await page.goto('/');
  const email = page.getByLabel('Email', { exact: true });
  await email.fill('not-an-email');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription(/Check this email address/);
  await email.fill('ok@example.com');
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: /03.*Experience/ }).click();
  await page.getByRole('button', { name: '+ Add experience' }).click();
  await page.getByLabel('Start date').fill('2024-05');
  await page.getByLabel('End date').fill('2023-01');
  await expect(page.getByLabel('End date')).toHaveAccessibleDescription(
    'End date is before the start date.',
  );
});

test('autosave is announced politely and only once typing pauses', async ({ page }) => {
  await page.goto('/');
  const live = page.locator('[role=status][aria-live=polite]');
  await page.getByLabel('Full name', { exact: true }).pressSequentially('Ana', { delay: 50 });
  await expect(live).not.toContainText('Saving');
  await expect(live).toHaveText('Saved on this browser');
});
