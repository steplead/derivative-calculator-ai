/**
 * Answer-first sentence for derivative pages.
 * It states the derivative before any derivation paragraph.
 */

import { factBySlug } from '@/content/derivative-lesson';
import { getInverseTrigLesson } from '@/content/inverse-trig-lessons';
import { strikingLead } from '@/content/striking-lessons';
import { normalizeLocale } from '@/lib/seo';

export function answerFirstLead(
  slug: string,
  locale: string,
  fallback?: { formula?: string; raw?: string | null }
): string | null {
  const custom = strikingLead(slug, locale);
  if (custom) return custom;
  const loc = normalizeLocale(locale);
  const inverse = getInverseTrigLesson(slug, loc);
  if (inverse) return inverse.formula;

  const fact = factBySlug(slug);
  if (fact) {
    if (fact.nondiff) {
      if (loc === 'es') return `La derivada de ${fact.display} no está definida en todos los reales: ${fact.nice}.`;
      if (loc === 'pt') return `A derivada de ${fact.display} não está definida em todos os reais: ${fact.nice}.`;
      return `The derivative of ${fact.display} is not defined for every real number: ${fact.nice}.`;
    }
    const domain = fact.copy?.[loc]?.domain;
    const formula = `d/dx ${fact.display} = ${fact.nice}.`;
    return domain ? `${formula} ${domain}` : formula;
  }

  const formula = (fallback?.formula || '').trim();
  const raw = (fallback?.raw || '').trim();
  if (!formula || !raw) return null;
  if (loc === 'es') return `La derivada de ${formula} es ${raw}.`;
  if (loc === 'pt') return `A derivada de ${formula} é ${raw}.`;
  return `The derivative of ${formula} is ${raw}.`;
}
