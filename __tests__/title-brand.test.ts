/**
 * A5: Title regression — brand must appear at most once per page.
 *
 * Root layout uses `template: '%s - Instant Step-by-Step Solutions | Derivative Calculator AI'`.
 * Pages must return ONLY the core title (no manual brand suffix), otherwise the
 * template appends a second brand → "Page | Brand - Instant... | Brand".
 */
import * as fs from 'fs';
import * as path from 'path';

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
    // Extract all title: `...` lines
    const titleLines = src.match(/title:\s*`[^`]*`/g) || [];
    for (const line of titleLines) {
      // Page-level titles must NOT contain the brand (layout template adds it once)
      expect(line).not.toContain('Derivative Calculator AI');
    }
  });

  it('homepage keeps its full default title (brand allowed once)', () => {
    const layout = fs.readFileSync(path.resolve(process.cwd(), 'app/layout.tsx'), 'utf8');
    // title.default contains brand once
    expect(layout).toContain("Derivative Calculator - Instant Step-by-Step Solutions | Derivative Calculator AI");
  });

  it('root layout template adds the brand exactly once', () => {
    const layout = fs.readFileSync(path.resolve(process.cwd(), 'app/layout.tsx'), 'utf8');
    const m = layout.match(/template:\s*'([^']*)'/);
    expect(m).toBeTruthy();
    const brandCount = (m![1].match(/Derivative Calculator AI/g) || []).length;
    expect(brandCount).toBe(1);
  });
});
