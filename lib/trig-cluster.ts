/**
 * Indexable trigonometric and inverse-trigonometric derivative pages.
 *
 * The hub links this curated set: the six standard functions, the three
 * inverse functions that have a real lesson, the textbook variants already
 * in the sitemap, and the three hyperbolic pages students mix up with trig.
 * Programmatic clones (sin(3x) … sin(15x), the minus-to-minus series) stay
 * out of the hub so it does not republish the thin URL set removed in P0.
 */

export const TRIG_HUB_PATH = '/derivatives-of-trig-functions';

export type TrigGroup = 'standard' | 'inverse' | 'variant' | 'hyperbolic';

export type TrigClusterPage = {
    slug: string;
    group: TrigGroup;
    /** Function written the way a calculus course writes it. */
    fn: string;
    /** Derivative in plain text, safe to render without a math engine. */
    derivative: string;
    /** Expression the on-site calculator accepts. */
    calculator: string;
};

export const TRIG_CLUSTER_PAGES: readonly TrigClusterPage[] = [
    { slug: 'derivative-of-sin-x', group: 'standard', fn: 'sin(x)', derivative: 'cos(x)', calculator: 'sin(x)' },
    { slug: 'derivative-of-cos-x', group: 'standard', fn: 'cos(x)', derivative: '−sin(x)', calculator: 'cos(x)' },
    { slug: 'derivative-of-tan-x', group: 'standard', fn: 'tan(x)', derivative: 'sec²(x)', calculator: 'tan(x)' },
    { slug: 'derivative-of-sec-x', group: 'standard', fn: 'sec(x)', derivative: 'sec(x) tan(x)', calculator: 'sec(x)' },
    { slug: 'derivative-of-csc-x', group: 'standard', fn: 'csc(x)', derivative: '−csc(x) cot(x)', calculator: 'csc(x)' },
    { slug: 'derivative-of-cot-x', group: 'standard', fn: 'cot(x)', derivative: '−csc²(x)', calculator: 'cot(x)' },
    { slug: 'derivative-of-arcsin-x', group: 'inverse', fn: 'arcsin(x) = sin⁻¹(x)', derivative: '1/√(1 − x²)', calculator: 'asin(x)' },
    { slug: 'derivative-of-arccos-x', group: 'inverse', fn: 'arccos(x) = cos⁻¹(x)', derivative: '−1/√(1 − x²)', calculator: 'acos(x)' },
    { slug: 'derivative-of-arctan-x', group: 'inverse', fn: 'arctan(x) = tan⁻¹(x)', derivative: '1/(1 + x²)', calculator: 'atan(x)' },
    { slug: 'derivative-of-sin-2x', group: 'variant', fn: 'sin(2x)', derivative: '2 cos(2x)', calculator: 'sin(2*x)' },
    { slug: 'derivative-of-cos-2x', group: 'variant', fn: 'cos(2x)', derivative: '−2 sin(2x)', calculator: 'cos(2*x)' },
    { slug: 'derivative-of-sin-squared-x', group: 'variant', fn: 'sin²(x)', derivative: '2 sin(x) cos(x)', calculator: 'sin(x)^2' },
    { slug: 'derivative-of-cos-squared-x', group: 'variant', fn: 'cos²(x)', derivative: '−2 sin(x) cos(x)', calculator: 'cos(x)^2' },
    { slug: 'derivative-of-tan-squared-x', group: 'variant', fn: 'tan²(x)', derivative: '2 tan(x) sec²(x)', calculator: 'tan(x)^2' },
    { slug: 'derivative-of-x-sin-x', group: 'variant', fn: 'x sin(x)', derivative: 'sin(x) + x cos(x)', calculator: 'x*sin(x)' },
    { slug: 'derivative-of-x-cos-x', group: 'variant', fn: 'x cos(x)', derivative: 'cos(x) − x sin(x)', calculator: 'x*cos(x)' },
    { slug: 'derivative-of-sinh-x', group: 'hyperbolic', fn: 'sinh(x)', derivative: 'cosh(x)', calculator: 'sinh(x)' },
    { slug: 'derivative-of-cosh-x', group: 'hyperbolic', fn: 'cosh(x)', derivative: 'sinh(x)', calculator: 'cosh(x)' },
    { slug: 'derivative-of-tanh-x', group: 'hyperbolic', fn: 'tanh(x)', derivative: 'sech²(x)', calculator: 'tanh(x)' },
];

export const TRIG_CLUSTER_SLUGS: ReadonlySet<string> = new Set(
    TRIG_CLUSTER_PAGES.map((page) => page.slug)
);

export const INVERSE_TRIG_SLUGS = [
    'derivative-of-arcsin-x',
    'derivative-of-arccos-x',
    'derivative-of-arctan-x',
] as const;

export type InverseTrigSlug = (typeof INVERSE_TRIG_SLUGS)[number];

export function isInverseTrigSlug(slug: string): slug is InverseTrigSlug {
    return (INVERSE_TRIG_SLUGS as readonly string[]).includes(slug);
}
