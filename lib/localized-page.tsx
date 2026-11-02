import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { withLocale } from '@/lib/read-locale';
import type { Locale } from '@/lib/seo';
import * as HomeRoute from '@/app/(site)/page';
import * as IntegralRoute from '@/app/(site)/integral/page';
import * as LimitRoute from '@/app/(site)/limit/page';
import * as MatrixRoute from '@/app/(site)/matrix/page';
import * as OdeRoute from '@/app/(site)/ode/page';
import * as CalculatorsRoute from '@/app/(site)/calculators/page';
import * as WikiRoute from '@/app/(site)/wiki/page';
import * as PracticeRoute from '@/app/(site)/practice/page';
import * as TrigRoute from '@/app/(site)/derivatives-of-trig-functions/page';
import * as PartialRoute from '@/app/(site)/partial-derivative-calculator/page';
import * as ImplicitRoute from '@/app/(site)/implicit-differentiation-calculator/page';
import * as ChainRoute from '@/app/(site)/chain-rule-calculator/page';
import * as SymbolabRoute from '@/app/(site)/symbolab-alternative/page';
import * as ComparisonRoute from '@/app/(site)/derivative-calculator-comparison/page';
import * as AboutRoute from '@/app/(site)/about/page';
import * as PrivacyRoute from '@/app/(site)/privacy/page';
import * as ContactRoute from '@/app/(site)/contact/page';
import * as DirectoryRoute from '@/app/(site)/directory/page';
import * as ProblemsRoute from '@/app/(site)/problems/page';
import * as WikiSlugRoute from '@/app/(site)/wiki/[slug]/page';
import * as PracticeLevelRoute from '@/app/(site)/practice/[level]/page';
import * as ProblemsTypeRoute from '@/app/(site)/problems/[type]/page';
import * as TagRoute from '@/app/(site)/problems/tag/[tag]/page';
import * as ProblemRoute from '@/app/(site)/[slug]/page';

type RouteModule = {
    default: (_props?: Record<string, unknown>) => Promise<unknown> | unknown;
    generateMetadata?: (_props?: Record<string, unknown>) => Promise<Metadata> | Metadata;
};

const STATIC_ROUTES: Record<string, RouteModule> = {
    '': HomeRoute,
    integral: IntegralRoute,
    limit: LimitRoute,
    matrix: MatrixRoute,
    ode: OdeRoute,
    calculators: CalculatorsRoute,
    wiki: WikiRoute,
    practice: PracticeRoute,
    'derivatives-of-trig-functions': TrigRoute,
    'partial-derivative-calculator': PartialRoute,
    'implicit-differentiation-calculator': ImplicitRoute,
    'chain-rule-calculator': ChainRoute,
    'symbolab-alternative': SymbolabRoute,
    'derivative-calculator-comparison': ComparisonRoute,
    about: AboutRoute,
    privacy: PrivacyRoute,
    contact: ContactRoute,
    directory: DirectoryRoute,
    problems: ProblemsRoute,
};

async function renderSegments(segments: string[]): Promise<unknown> {
    const key = segments.join('/');
    const hit = STATIC_ROUTES[key];
    if (hit) return hit.default();

    if (segments[0] === 'wiki' && segments.length === 2) {
        return WikiSlugRoute.default({ params: { slug: segments[1] } });
    }
    if (segments[0] === 'practice' && segments.length === 2) {
        return PracticeLevelRoute.default({ params: { level: segments[1] } });
    }
    if (segments[0] === 'problems' && segments[1] === 'tag' && segments.length === 3) {
        return TagRoute.default({ params: { tag: segments[2] } });
    }
    if (segments[0] === 'problems' && segments.length === 2) {
        return ProblemsTypeRoute.default({ params: { type: segments[1] } });
    }
    if (segments.length === 1) {
        return ProblemRoute.default({ params: { slug: segments[0] } });
    }
    notFound();
}

async function metadataForSegments(segments: string[]): Promise<Metadata> {
    const key = segments.join('/');
    const hit = STATIC_ROUTES[key];
    if (hit?.generateMetadata) return hit.generateMetadata();

    if (segments[0] === 'wiki' && segments.length === 2) {
        return WikiSlugRoute.generateMetadata({ params: { slug: segments[1] } });
    }
    if (segments[0] === 'practice' && segments.length === 2) {
        return PracticeLevelRoute.generateMetadata({ params: { level: segments[1] } });
    }
    if (segments[0] === 'problems' && segments[1] === 'tag' && segments.length === 3) {
        return TagRoute.generateMetadata({ params: { tag: segments[2] } });
    }
    if (segments[0] === 'problems' && segments.length === 2) {
        return ProblemsTypeRoute.generateMetadata({ params: { type: segments[1] } });
    }
    if (segments.length === 1) {
        return ProblemRoute.generateMetadata({ params: { slug: segments[0] } });
    }
    return { title: 'Not Found', robots: { index: false, follow: false } };
}

export function localizedMetadata(locale: Locale, segments: string[]): Promise<Metadata> {
    return withLocale(locale, () => metadataForSegments(segments));
}

export function LocalizedPage({ locale, segments }: { locale: Locale; segments: string[] }): Promise<unknown> {
    return withLocale(locale, () => renderSegments(segments));
}
