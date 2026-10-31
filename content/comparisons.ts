/**
 * Honest comparison copy. Competitor cells quote or paraphrase only what those
 * sites published. Nothing here is a speed, accuracy, or price claim.
 */

import type { Locale } from '@/lib/seo';

export type ComparisonKey = 'symbolab' | 'comparison';

export type ComparisonCopy = {
  h1: string;
  h1Id: string;
  description: string;
  paragraphs: string[];
  featureHeading: string;
  features: string[];
  columns: string[];
  rows: { feature: string; cells: string[] }[];
  sourcesHeading: string;
  sources: { href: string; label: string }[];
  note: string;
};

const COLUMNS = [
  'Derivative Calculator AI',
  'Symbolab',
  'Wolfram|Alpha',
  'Mathway',
  'derivative-calculator.net',
];

const SOURCES = [
  { href: 'https://www.symbolab.com/registration', label: 'Symbolab registration (Pro list)' },
  { href: 'https://www.wolframalpha.com/pro/pricing/', label: 'Wolfram|Alpha Pro pricing' },
  { href: 'https://www.wolframalpha.com/pro/step-by-step-math-solver', label: 'Wolfram|Alpha step-by-step' },
  { href: 'https://www.mathway.com/', label: 'Mathway homepage' },
  { href: 'https://www.mathway.com/premium-terms', label: 'Mathway premium terms' },
  { href: 'https://www.derivative-calculator.net/', label: 'derivative-calculator.net' },
];

const en: Record<ComparisonKey, ComparisonCopy> = {
  symbolab: {
    h1: 'A free Symbolab alternative with full steps',
    h1Id: 'symbolab-alternative',
    description: 'What this free derivative calculator does, and what Symbolab’s own registration page lists under Pro. No invented limits.',
    paragraphs: [
      'Derivative Calculator AI is free and does not ask you to create an account. You type a function, the computer-algebra engine differentiates it, and the page shows the full steps. Each step has a why explanation. A model writes that explanation when the server is configured with one; otherwise the calculator writes the reason the rule applies.',
      'Symbolab is a different product. Its public registration page lists “Full access to solution steps” and “Full access to AI chat” under Symbolab Pro. This page does not claim that the free Symbolab solver shows nothing, and it does not claim that Pro is the only way to see an answer. It records the wording Symbolab uses for those two features.',
      'If you need an integral or a limit as well as a derivative, those calculators are on this site and use the same pattern: a symbolic result, steps that say why, a check-answer box, and practice problems. English, Spanish, and Portuguese are the same tools, not separate products.',
    ],
    featureHeading: 'What each public page actually says',
    features: [],
    columns: COLUMNS,
    rows: [
      {
        feature: 'Open the calculator',
        cells: ['Free, no account', 'Public solver', 'Basic plan is free to open', 'Homepage says it is free', 'Homepage says it is free'],
      },
      {
        feature: 'Full worked steps',
        cells: [
          'Yes, on the free calculator',
          'Pro list includes “Full access to solution steps”',
          'Pricing page: Basic does not include step-by-step solutions',
          'Homepage and premium terms disagree; see the note',
          'Free calculator has “Show calculation steps”',
        ],
      },
      {
        feature: 'Why a step is valid',
        cells: [
          'Yes. A why explanation on each step',
          'Pro lists “Full access to AI chat”, which is a chat product',
          'Pro steps “explain how that answer was found”',
          'Not described as a per-step why button',
          'Each step applies one differentiation rule',
        ],
      },
    ],
    sourcesHeading: 'Sources checked on 31 October 2026',
    sources: SOURCES,
    note: 'Mathway’s homepage says you can get step-by-step solutions without signing up, and that a subscription unlocks the full work for every step. Mathway’s premium terms describe step-by-step access as a subscription benefit. Both sentences are on mathway.com. This table does not collapse them into one yes or no. Prices are omitted because they change.',
  },
  comparison: {
    h1: 'Derivative calculator comparison',
    h1Id: 'derivative-calculator-comparison',
    description: 'A sourced comparison of free steps and why-explanations. Competitor cells follow their own pages only.',
    paragraphs: [
      'This comparison is limited to features a reader can check on a public page: whether the calculator is free to open, whether full steps are included without a paid plan, and whether a step explains why it is valid. It is not a ranking, and it does not score accuracy or speed.',
      'On this site the derivative, integral, and limit calculators are free and do not require an account. The steps come from a computer-algebra engine. Asking why a step is valid returns an explanation. When an AI key is configured, a model writes it; otherwise the explanation is the rule reason for that step.',
      'Wolfram|Alpha’s pricing page says the Basic plan does not include step-by-step solutions, and that those solutions are part of Pro. derivative-calculator.net says its calculator is free and can show the full working. Symbolab’s registration page puts full solution steps and AI chat on the Pro list. Mathway’s homepage and its premium terms use different wording for steps, so both are quoted instead of a single label.',
    ],
    featureHeading: 'Feature table',
    features: [],
    columns: COLUMNS,
    rows: [
      {
        feature: 'Free to open',
        cells: ['Yes', 'Public solver', 'Basic plan', 'Homepage says yes', 'Homepage says yes'],
      },
      {
        feature: 'Account required here',
        cells: ['No', 'Not stated for the solver', 'Not stated for Basic', 'Homepage says no sign-up for steps', 'Not mentioned on the homepage'],
      },
      {
        feature: 'Full steps without a paid plan',
        cells: [
          'Yes',
          'Pro lists full access to solution steps',
          'No on Basic, per the pricing page',
          'See the note; the two Mathway pages differ',
          'Yes, “Show calculation steps”',
        ],
      },
      {
        feature: 'Why-explanation',
        cells: [
          'Yes, on each step',
          'AI chat is listed under Pro',
          'Pro describes steps that explain the answer',
          'Not described as an AI why button',
          'Steps name the rule; no AI model is described',
        ],
      },
    ],
    sourcesHeading: 'Sources checked on 31 October 2026',
    sources: SOURCES,
    note: 'Mathway’s homepage says step-by-step solutions are available without signing up, and that an optional subscription unlocks the full work shown for every step. The premium terms say a subscription allows access to step-by-step solutions. This page reports both and does not invent a price.',
  },
};

const es: Record<ComparisonKey, ComparisonCopy> = {
  symbolab: {
    ...en.symbolab,
    h1: 'Alternativa gratis a Symbolab con pasos completos',
    description: 'Qué hace esta calculadora gratis y qué lista Symbolab en su página de registro bajo Pro. Sin límites inventados.',
    paragraphs: [
      'Derivative Calculator AI es gratis y no pide una cuenta. Escribes una función, el sistema de álgebra simbólica la deriva y la página muestra los pasos completos. Cada paso tiene una explicación de por qué es válido. Si el servidor tiene una clave de IA, un modelo la redacta; si no, la escribe la propia calculadora.',
      'Symbolab es otro producto. Su página pública de registro lista «Full access to solution steps» y «Full access to AI chat» dentro de Symbolab Pro. Esta página no afirma que el solver gratuito no muestre nada, ni que Pro sea la única forma de ver una respuesta. Recoge el texto que Symbolab usa para esas dos funciones.',
      'Si también necesitas una integral o un límite, esas calculadoras están en este sitio y siguen el mismo esquema: resultado simbólico, pasos con el porqué, comprobación de la respuesta y problemas de práctica. Inglés, español y portugués son la misma herramienta.',
    ],
    featureHeading: 'Lo que dice cada página pública',
    rows: [
      {
        feature: 'Abrir la calculadora',
        cells: ['Gratis, sin cuenta', 'Solver público', 'El plan Basic se puede abrir', 'La portada dice que es gratis', 'La portada dice que es gratis'],
      },
      {
        feature: 'Pasos completos',
        cells: [
          'Sí, en la calculadora gratis',
          'Pro incluye «Full access to solution steps»',
          'La página de precios: Basic no incluye soluciones paso a paso',
          'La portada y los términos de pago no coinciden; mira la nota',
          'La calculadora gratis tiene «Show calculation steps»',
        ],
      },
      {
        feature: 'Por qué el paso es válido',
        cells: [
          'Sí. Una explicación en cada paso',
          'Pro lista «Full access to AI chat», que es un chat',
          'Los pasos Pro «explican cómo se encontró la respuesta»',
          'No se describe un botón de porqué por paso',
          'Cada paso aplica una regla de derivación',
        ],
      },
    ],
    sourcesHeading: 'Fuentes revisadas el 31 de octubre de 2026',
    note: 'La portada de Mathway dice que hay soluciones paso a paso sin registrarse y que una suscripción abre el desarrollo completo de cada paso. Los términos premium describen ese acceso como beneficio de pago. Las dos frases están en mathway.com. Esta tabla no las reduce a un sí o un no. Los precios se omiten porque cambian.',
  },
  comparison: {
    ...en.comparison,
    h1: 'Comparación de calculadoras de derivadas',
    description: 'Comparación con fuentes de pasos gratis y explicaciones. Las celdas de la competencia siguen solo sus páginas.',
    paragraphs: [
      'Esta comparación se limita a lo que se puede comprobar en una página pública: si la calculadora se abre gratis, si los pasos completos entran sin un plan de pago y si un paso explica por qué es válido. No es un ranking y no puntúa exactitud ni velocidad.',
      'En este sitio las calculadoras de derivadas, integrales y límites son gratis y no piden cuenta. Los pasos salen de un sistema de álgebra simbólica. Preguntar por qué un paso es válido devuelve una explicación. Con una clave de IA configurada, la escribe un modelo; si no, es la razón de la regla.',
      'La página de precios de Wolfram|Alpha dice que el plan Basic no incluye soluciones paso a paso y que forman parte de Pro. derivative-calculator.net dice que su calculadora es gratis y puede mostrar el desarrollo. La página de registro de Symbolab pone los pasos completos y el chat de IA en la lista Pro. La portada de Mathway y sus términos premium usan frases distintas, así que se citan las dos.',
    ],
    featureHeading: 'Tabla de funciones',
    rows: en.comparison.rows.map((row, index) => ({
      feature: ['Abrir gratis', 'Cuenta obligatoria aquí', 'Pasos completos sin plan de pago', 'Explicación del porqué'][index],
      cells: row.cells,
    })),
    sourcesHeading: 'Fuentes revisadas el 31 de octubre de 2026',
    note: 'La portada de Mathway dice que hay soluciones paso a paso sin registrarse y que una suscripción abre el desarrollo completo de cada paso. Los términos premium describen ese acceso como beneficio de pago. Las dos frases están en mathway.com. Esta tabla no las reduce a un sí o un no. Los precios se omiten porque cambian.',
  },
};

const pt: Record<ComparisonKey, ComparisonCopy> = {
  symbolab: {
    ...en.symbolab,
    h1: 'Alternativa grátis ao Symbolab com passos completos',
    description: 'O que esta calculadora grátis faz e o que a página de registro do Symbolab lista no Pro. Sem limites inventados.',
    paragraphs: [
      'Derivative Calculator AI é grátis e não pede uma conta. Você digita uma função, o sistema de álgebra simbólica deriva e a página mostra os passos completos. Cada passo tem uma explicação de por que é válido. Se o servidor tem uma chave de IA, um modelo escreve; se não, a calculadora escreve o motivo da regra.',
      'Symbolab é outro produto. A página pública de registro lista «Full access to solution steps» e «Full access to AI chat» no Symbolab Pro. Esta página não afirma que o solver grátis não mostra nada, nem que o Pro é a única forma de ver uma resposta. Ela registra o texto que o Symbolab usa para esses dois recursos.',
      'Se você também precisa de uma integral ou de um limite, essas calculadoras estão neste site e seguem o mesmo esquema: resultado simbólico, passos com o porquê, conferência da resposta e problemas de prática. Inglês, espanhol e português são a mesma ferramenta.',
    ],
    featureHeading: 'O que cada página pública diz',
    rows: [
      { feature: 'Abrir a calculadora', cells: es.symbolab.rows[0].cells },
      { feature: 'Passos completos', cells: es.symbolab.rows[1].cells },
      { feature: 'Por que o passo é válido', cells: es.symbolab.rows[2].cells },
    ],
    sourcesHeading: 'Fontes conferidas em 31 de outubro de 2026',
    note: 'A página inicial da Mathway diz que há soluções passo a passo sem cadastro e que uma assinatura abre o desenvolvimento completo de cada passo. Os termos premium descrevem esse acesso como benefício pago. As duas frases estão em mathway.com. Esta tabela não as reduz a um sim ou não. Preços ficam de fora porque mudam.',
  },
  comparison: {
    ...en.comparison,
    h1: 'Comparação de calculadoras de derivadas',
    description: 'Comparação com fontes sobre passos grátis e explicações. As células dos concorrentes seguem só as páginas deles.',
    paragraphs: [
      'Esta comparação se limita ao que dá para conferir numa página pública: se a calculadora abre de graça, se os passos completos entram sem um plano pago e se um passo explica por que é válido. Não é um ranking e não avalia precisão nem velocidade.',
      'Neste site as calculadoras de derivadas, integrais e limites são grátis e não pedem conta. Os passos vêm de um sistema de álgebra simbólica. Perguntar por que um passo é válido devolve uma explicação. Com uma chave de IA configurada, um modelo escreve; caso contrário, é o motivo da regra.',
      'A página de preços da Wolfram|Alpha diz que o plano Basic não inclui soluções passo a passo e que elas fazem parte do Pro. O derivative-calculator.net diz que a calculadora é grátis e pode mostrar o desenvolvimento. A página de registro do Symbolab coloca os passos completos e o chat de IA na lista Pro. A página inicial da Mathway e os termos premium usam frases diferentes, então as duas são citadas.',
    ],
    featureHeading: 'Tabela de recursos',
    rows: [
      { feature: 'Abrir grátis', cells: en.comparison.rows[0].cells },
      { feature: 'Conta obrigatória aqui', cells: en.comparison.rows[1].cells },
      { feature: 'Passos completos sem plano pago', cells: en.comparison.rows[2].cells },
      { feature: 'Explicação do porquê', cells: en.comparison.rows[3].cells },
    ],
    sourcesHeading: 'Fontes conferidas em 31 de outubro de 2026',
    note: ptNote(),
  },
};

function ptNote(): string {
  return 'A página inicial da Mathway diz que as soluções passo a passo estão disponíveis sem cadastro e que uma assinatura opcional abre o trabalho completo de cada passo. Os termos premium dizem que a assinatura permite acesso às soluções passo a passo. Esta página registra as duas frases e não inventa um preço.';
}

export const COMPARISONS: Record<Locale, Record<ComparisonKey, ComparisonCopy>> = { en, es, pt };

export function comparisonPlainText(copy: ComparisonCopy): string {
  return [
    copy.paragraphs.join(' '),
    copy.rows.map((row) => `${row.feature} ${row.cells.join(' ')}`).join(' '),
    copy.note,
  ].join(' ');
}
