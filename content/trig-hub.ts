/**
 * Copy for /derivatives-of-trig-functions. The formula table itself lives in
 * lib/trig-cluster.ts so the links and the derivatives cannot drift apart.
 */

import type { Locale } from '@/lib/seo';

export type TrigHubFaq = { question: string; answer: string };

export type TrigHubCopy = {
    title: string;
    description: string;
    h1: string;
    lede: string[];
    standardHeading: string;
    standardIntro: string;
    inverseHeading: string;
    inverseIntro: string;
    variantHeading: string;
    variantIntro: string;
    hyperbolicHeading: string;
    hyperbolicIntro: string;
    columnFunction: string;
    columnDerivative: string;
    columnPage: string;
    solveLabel: string;
    faqHeading: string;
    faqs: TrigHubFaq[];
    breadcrumb: string;
};

const en: TrigHubCopy = {
    title: 'Derivatives of Trig Functions',
    description: 'Derivatives of sin, cos, tan, sec, csc, cot, arcsin, arccos, and arctan, each with its formula and a step-by-step page.',
    h1: 'Derivatives of trigonometric functions',
    lede: [
        'The six trigonometric functions and the three common inverse functions each have one derivative worth memorizing. Everything else on this page — sin(2x), sin²(x), x sin(x) — is one of those nine formulas plus the chain rule or the product rule.',
        'A cofunction picks up a minus sign: the derivative of cos(x) is −sin(x), of cot(x) is −csc²(x), and of csc(x) is −csc(x) cot(x). The inverse functions are a separate family. sin⁻¹(x) means arcsin(x), not 1/sin(x). Their derivatives come from implicit differentiation, not from the quotient rule on a reciprocal.',
    ],
    standardHeading: 'Derivatives of sin, cos, tan, sec, csc, and cot',
    standardIntro: 'Sine and cosine are the base pair. Tangent is sin/cos, so the quotient rule produces sec²(x). Secant, cosecant, and cotangent are the reciprocals, and each derivative keeps the original function in the answer.',
    inverseHeading: 'Derivatives of arcsin, arccos, and arctan',
    inverseIntro: 'Courses also write these as sin⁻¹(x), cos⁻¹(x), and tan⁻¹(x). The superscript is inverse-function notation. It is not an exponent, so these are not the derivatives of csc, sec, or cot. Arcsin and arccos are only differentiable on (−1, 1). Arctan is differentiable for every real x.',
    variantHeading: 'Chain rule and product rule on trig functions',
    variantIntro: 'sin(2x) is sin of an inside function, so multiply by the derivative of 2x. sin²(x) is a power of sin, so the chain rule contributes 2 sin(x) and the derivative of the inside, cos(x). x sin(x) is a product, so both factors survive.',
    hyperbolicHeading: 'Hyperbolic functions students mix up with trig',
    hyperbolicIntro: 'sinh, cosh, and tanh are not trigonometric. The pattern looks familiar and the signs do not match: the derivative of cosh(x) is sinh(x), with no minus sign. They are listed here because the names are easy to confuse with sin, cos, and tan.',
    columnFunction: 'Function',
    columnDerivative: 'Derivative',
    columnPage: 'Worked page',
    solveLabel: 'Solve',
    faqHeading: 'Questions about trigonometric derivatives',
    faqs: [
        {
            question: 'What is the derivative of sin, cos, and tan?',
            answer: 'The derivative of sin(x) is cos(x). The derivative of cos(x) is −sin(x). The derivative of tan(x) is sec²(x). The minus sign on cosine is the one most often dropped.',
        },
        {
            question: 'What is the derivative of sec, csc, and cot?',
            answer: 'The derivative of sec(x) is sec(x) tan(x). The derivative of csc(x) is −csc(x) cot(x). The derivative of cot(x) is −csc²(x). Cotangent and cosecant both carry a minus sign.',
        },
        {
            question: 'What is the derivative of the inverse trig functions?',
            answer: 'The derivative of arcsin(x), also written sin⁻¹(x), is 1/√(1−x²). The derivative of arccos(x), or cos⁻¹(x), is −1/√(1−x²). The derivative of arctan(x), or tan⁻¹(x), is 1/(1+x²). Each has its own step-by-step page.',
        },
        {
            question: 'Does sin⁻¹(x) mean 1/sin(x)?',
            answer: 'No. In calculus, sin⁻¹(x) means the inverse sine, arcsin(x). The reciprocal 1/sin(x) is csc(x), and its derivative is −csc(x) cot(x), not 1/√(1−x²).',
        },
    ],
    breadcrumb: 'Trigonometric derivatives',
};

const es: TrigHubCopy = {
    title: 'Derivadas de funciones trigonométricas',
    description: 'Derivadas de sen, cos, tan, sec, csc, cot, arcsen, arccos y arctan, con la fórmula y una página paso a paso para cada función.',
    h1: 'Derivadas de las funciones trigonométricas',
    lede: [
        'Las seis funciones trigonométricas y las tres inversas habituales tienen cada una una derivada que conviene memorizar. El resto de esta página — sen(2x), sen²(x), x sen(x) — es una de esas nueve fórmulas junto con la regla de la cadena o la del producto.',
        'Una cofunción arrastra un signo menos: la derivada de cos(x) es −sen(x), la de cot(x) es −csc²(x) y la de csc(x) es −csc(x) cot(x). Las inversas son otra familia. sen⁻¹(x) significa arcsen(x), no 1/sen(x). Sus derivadas salen de la diferenciación implícita, no de la regla del cociente aplicada a un recíproco. En las fórmulas de abajo, sin(x) y sen(x) son la misma función; la calculadora escribe sin.',
    ],
    standardHeading: 'Derivadas de sen, cos, tan, sec, csc y cot',
    standardIntro: 'Seno y coseno son el par de base. La tangente es sen/cos, así que la regla del cociente da sec²(x). Secante, cosecante y cotangente son los recíprocos, y cada derivada conserva la función original en la respuesta.',
    inverseHeading: 'Derivadas de arcsen, arccos y arctan',
    inverseIntro: 'También se escriben sen⁻¹(x), cos⁻¹(x) y tan⁻¹(x). El superíndice indica función inversa, no un exponente: no son las derivadas de csc, sec o cot. Arcsen y arccos solo son derivables en (−1, 1). Arctan es derivable en todos los reales.',
    variantHeading: 'Regla de la cadena y del producto',
    variantIntro: 'sen(2x) es el seno de una función interior, así que se multiplica por la derivada de 2x. sen²(x) es una potencia del seno: la cadena aporta 2 sen(x) y la derivada del interior, cos(x). x sen(x) es un producto, y los dos factores permanecen.',
    hyperbolicHeading: 'Funciones hiperbólicas que se confunden con las trigonométricas',
    hyperbolicIntro: 'sinh, cosh y tanh no son trigonométricas. El patrón se parece y los signos no coinciden: la derivada de cosh(x) es sinh(x), sin signo menos. Están aquí porque el nombre se confunde con sen, cos y tan.',
    columnFunction: 'Función',
    columnDerivative: 'Derivada',
    columnPage: 'Página resuelta',
    solveLabel: 'Calcular',
    faqHeading: 'Preguntas sobre derivadas trigonométricas',
    faqs: [
        {
            question: '¿Cuál es la derivada de sen, cos y tan?',
            answer: 'La derivada de sen(x) es cos(x). La derivada de cos(x) es −sen(x). La derivada de tan(x) es sec²(x). El signo menos del coseno es el que más se omite.',
        },
        {
            question: '¿Cuál es la derivada de sec, csc y cot?',
            answer: 'La derivada de sec(x) es sec(x) tan(x). La derivada de csc(x) es −csc(x) cot(x). La derivada de cot(x) es −csc²(x). Cotangente y cosecante llevan signo menos.',
        },
        {
            question: '¿Cuál es la derivada de las funciones trigonométricas inversas?',
            answer: 'La derivada de arcsen(x), también sen⁻¹(x), es 1/√(1−x²). La de arccos(x), o cos⁻¹(x), es −1/√(1−x²). La de arctan(x), o tan⁻¹(x), es 1/(1+x²). Cada una tiene su página con el desarrollo.',
        },
        {
            question: '¿sen⁻¹(x) significa 1/sen(x)?',
            answer: 'No. En cálculo, sen⁻¹(x) es el seno inverso, arcsen(x). El recíproco 1/sen(x) es csc(x), y su derivada es −csc(x) cot(x), no 1/√(1−x²).',
        },
    ],
    breadcrumb: 'Derivadas trigonométricas',
};

const pt: TrigHubCopy = {
    title: 'Derivadas das funções trigonométricas',
    description: 'Derivadas de sen, cos, tan, sec, csc, cot, arcsen, arccos e arctan, com a fórmula e uma página passo a passo para cada função.',
    h1: 'Derivadas das funções trigonométricas',
    lede: [
        'As seis funções trigonométricas e as três inversas usuais têm, cada uma, uma derivada que vale memorizar. O resto desta página — sen(2x), sen²(x), x sen(x) — é uma dessas nove fórmulas com a regra da cadeia ou a do produto.',
        'Uma cofunção ganha um sinal de menos: a derivada de cos(x) é −sen(x), a de cot(x) é −csc²(x) e a de csc(x) é −csc(x) cot(x). As inversas são outra família. sen⁻¹(x) significa arcsen(x), não 1/sen(x). As derivadas saem da diferenciação implícita, não da regra do quociente num recíproco. Nas fórmulas abaixo, sin(x) e sen(x) são a mesma função; a calculadora escreve sin.',
    ],
    standardHeading: 'Derivadas de sen, cos, tan, sec, csc e cot',
    standardIntro: 'Seno e cosseno são o par de base. A tangente é sen/cos, então a regra do quociente produz sec²(x). Secante, cossecante e cotangente são os recíprocos, e cada derivada mantém a função original na resposta.',
    inverseHeading: 'Derivadas de arcsen, arccos e arctan',
    inverseIntro: 'Também se escrevem sen⁻¹(x), cos⁻¹(x) e tan⁻¹(x). O expoente indica função inversa, não uma potência: não são as derivadas de csc, sec ou cot. Arcsen e arccos só são deriváveis em (−1, 1). Arctan é derivável em todos os reais.',
    variantHeading: 'Regra da cadeia e do produto',
    variantIntro: 'sen(2x) é o seno de uma função interna, então multiplica-se pela derivada de 2x. sen²(x) é uma potência do seno: a cadeia contribui com 2 sen(x) e com a derivada do interior, cos(x). x sen(x) é um produto, e os dois fatores ficam.',
    hyperbolicHeading: 'Funções hiperbólicas confundidas com as trigonométricas',
    hyperbolicIntro: 'sinh, cosh e tanh não são trigonométricas. O padrão parece familiar e os sinais não batem: a derivada de cosh(x) é sinh(x), sem sinal de menos. Estão aqui porque o nome se confunde com sen, cos e tan.',
    columnFunction: 'Função',
    columnDerivative: 'Derivada',
    columnPage: 'Página resolvida',
    solveLabel: 'Calcular',
    faqHeading: 'Perguntas sobre derivadas trigonométricas',
    faqs: [
        {
            question: 'Qual é a derivada de sen, cos e tan?',
            answer: 'A derivada de sen(x) é cos(x). A derivada de cos(x) é −sen(x). A derivada de tan(x) é sec²(x). O sinal de menos do cosseno é o que mais se perde.',
        },
        {
            question: 'Qual é a derivada de sec, csc e cot?',
            answer: 'A derivada de sec(x) é sec(x) tan(x). A derivada de csc(x) é −csc(x) cot(x). A derivada de cot(x) é −csc²(x). Cotangente e cossecante levam sinal de menos.',
        },
        {
            question: 'Qual é a derivada das funções trigonométricas inversas?',
            answer: 'A derivada de arcsen(x), também sen⁻¹(x), é 1/√(1−x²). A de arccos(x), ou cos⁻¹(x), é −1/√(1−x²). A de arctan(x), ou tan⁻¹(x), é 1/(1+x²). Cada uma tem uma página com o desenvolvimento.',
        },
        {
            question: 'sen⁻¹(x) significa 1/sen(x)?',
            answer: 'Não. Em cálculo, sen⁻¹(x) é o seno inverso, arcsen(x). O recíproco 1/sen(x) é csc(x), e a derivada dele é −csc(x) cot(x), não 1/√(1−x²).',
        },
    ],
    breadcrumb: 'Derivadas trigonométricas',
};

export const trigHubCopy: Record<Locale, TrigHubCopy> = { en, es, pt };

export function trigHubPlainText(copy: TrigHubCopy): string {
    return [
        copy.h1,
        ...copy.lede,
        copy.standardIntro,
        copy.inverseIntro,
        copy.variantIntro,
        copy.hyperbolicIntro,
        ...copy.faqs.flatMap((faq) => [faq.question, faq.answer]),
    ].join(' ');
}
