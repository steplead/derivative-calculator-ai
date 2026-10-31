/**
 * Titles are keyword-first and at most 60 characters.
 * The root layout must not append a slogan or a second brand.
 */
import * as fs from 'fs';
import * as path from 'path';
import { HOME_DESCRIPTIONS, PAGE_TITLES, keywordTitle } from '@/lib/seo';

const PAGES: Array<[string, string]> = [
  ['app/integral/page.tsx', 'generateMetadata'],
  ['app/limit/page.tsx', 'generateMetadata'],
  ['app/ode/page.tsx', 'generateMetadata'],
  ['app/matrix/page.tsx', 'generateMetadata'],
  ['app/calculators/page.tsx', 'generateMetadata'],
  ['app/directory/page.tsx', 'generateMetadata'],
  ['app/problems/page.tsx', 'generateMetadata'],
  ['app/wiki/page.tsx', 'generateMetadata'],
  ['app/[slug]/page.tsx', 'generateMetadata'],
];

describe('A5: Title brand duplication regression', () => {
  it.each(PAGES)('%s core title must not hardcode the brand', (file) => {
    const src = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    const titleLines = src.match(/title:\s*`[^`]*`/g) || [];
    for (const line of titleLines) {
      expect(line).not.toContain('Derivative Calculator AI');
    }
  });

  it('homepage default title is the keyword-first calculator title', () => {
    const layout = fs.readFileSync(path.resolve(process.cwd(), 'app/layout.tsx'), 'utf8');
    expect(layout).toContain('Derivative Calculator & Solver with Steps (Free)');
    expect(layout).not.toContain('Instant Step-by-Step Solutions');
  });

  it('root layout template does not append a brand slogan', () => {
    const layout = fs.readFileSync(path.resolve(process.cwd(), 'app/layout.tsx'), 'utf8');
    const m = layout.match(/template:\s*'([^']*)'/);
    expect(m).toBeTruthy();
    expect(m![1]).toBe('%s');
  });

  it('every curated page title is at most 60 characters', () => {
    for (const titles of Object.values(PAGE_TITLES)) {
      for (const title of Object.values(titles)) {
        expect(keywordTitle(title).length).toBeLessThanOrEqual(60);
      }
    }
    for (const description of Object.values(HOME_DESCRIPTIONS)) {
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });
});
