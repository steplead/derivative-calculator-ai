/**
 * Unique lessons for the three inverse-trig pages GSC already ranks:
 * /derivative-of-arcsin-x, /derivative-of-arccos-x, /derivative-of-arctan-x.
 *
 * The visible H1 stays the library heading ("Derivative of asin(x)"). These
 * lessons put the searched notation — arcsin, sin^-1, atan — in the title,
 * the H2s, and the body. FAQ answers are the strings emitted as FAQPage JSON-LD.
 */

import { normalizeLocale, type Locale } from '@/lib/seo';
import { TRIG_HUB_PATH, isInverseTrigSlug, type InverseTrigSlug } from '@/lib/trig-cluster';

export type LessonExample = {
    title: string;
    steps: string[];
    answer: string;
    calculatorFormula: string;
};

export type InverseTrigLesson = {
    slug: InverseTrigSlug;
    title: string;
    description: string;
    formulaHeading: string;
    formula: string;
    formulaNote: string;
    calculatorFormula: string;
    calculatorLabel: string;
    derivationHeading: string;
    derivation: string[];
    derivationSteps: string[];
    examplesHeading: string;
    examples: LessonExample[];
    mistakesHeading: string;
    mistakes: Array<{ title: string; text: string }>;
    relatedHeading: string;
    related: Array<{ href: string; label: string; note: string }>;
    faqs: Array<{ question: string; answer: string }>;
};

const hub = TRIG_HUB_PATH;

const en: Record<InverseTrigSlug, InverseTrigLesson> = {
    'derivative-of-arcsin-x': {
        slug: 'derivative-of-arcsin-x',
        title: 'Derivative of arcsin(x) (sin^-1 x)',
        description: 'The derivative of arcsin(x), or sin^-1(x), is 1/sqrt(1-x^2) on (-1, 1). Proof, examples, and the csc mix-up.',
        formulaHeading: 'Formula for arcsin(x) and sin^-1(x)',
        formula: 'd/dx arcsin(x) = d/dx sin^-1(x) = 1 / sqrt(1 - x^2), for -1 < x < 1.',
        formulaNote: 'At x = ±1 the graph of arcsin has a vertical tangent, so the derivative is not a real number there. The calculator on this page is already filled with asin(x), which is the same function.',
        calculatorFormula: 'asin(x)',
        calculatorLabel: 'Open arcsin(x) in the derivative calculator',
        derivationHeading: 'Implicit differentiation that produces 1/sqrt(1-x^2)',
        derivation: [
            'Let y = arcsin(x). By definition y is the unique angle in [-π/2, π/2] whose sine is x, so sin(y) = x. Differentiating that equation is shorter than differentiating the inverse from the limit definition.',
            'The left side is a composition. The chain rule gives cos(y) · y\'. The right side is the line y = x, whose derivative is 1. Canceling is then one division: y\' = 1/cos(y), as long as cos(y) is not zero.',
            'Cosine is non-negative on the range of arcsin. That fact picks the positive square root: cos(y) = sqrt(1 - sin^2(y)) = sqrt(1 - x^2). Substituting it in is the whole proof. The same line is the derivative of sin^-1(x); the notation does not change the function.',
        ],
        derivationSteps: [
            'Set y = arcsin(x), so sin(y) = x and y is in [-π/2, π/2].',
            'Differentiate both sides: cos(y) · dy/dx = 1.',
            'Solve for the derivative: dy/dx = 1/cos(y).',
            'Because y stays in [-π/2, π/2], cos(y) ≥ 0, so cos(y) = sqrt(1 - sin^2(y)).',
            'Replace sin(y) with x: cos(y) = sqrt(1 - x^2).',
            'Conclude d/dx arcsin(x) = 1/sqrt(1 - x^2), for -1 < x < 1.',
        ],
        examplesHeading: 'Worked examples, including arcsin of a multiple',
        examples: [
            {
                title: 'Slope of arcsin at the origin',
                steps: [
                    'Substitute x = 0 into 1/sqrt(1 - x^2).',
                    'The inside of the root is 1, and sqrt(1) = 1.',
                    'The slope is 1. Near zero, arcsin(x) and the line y = x share a tangent.',
                ],
                answer: '1',
                calculatorFormula: 'asin(x)',
            },
            {
                title: 'Derivative of arcsin(2x)',
                steps: [
                    'The outer derivative is 1/sqrt(1 - u^2) with u = 2x.',
                    'The inner derivative is 2. The chain rule multiplies them.',
                    '1 - (2x)^2 = 1 - 4x^2, so the result is 2/sqrt(1 - 4x^2).',
                    'The domain shrinks: |2x| < 1, which means |x| < 1/2.',
                ],
                answer: '2 / sqrt(1 - 4x^2), for |x| < 1/2',
                calculatorFormula: 'asin(2*x)',
            },
            {
                title: 'Derivative of x · arcsin(x)',
                steps: [
                    'This is a product. Use (uv)\' = u\'v + uv\' with u = x and v = arcsin(x).',
                    'u\' = 1 and v\' = 1/sqrt(1 - x^2).',
                    'The two terms are arcsin(x) and x/sqrt(1 - x^2). Both stay in the answer.',
                ],
                answer: 'arcsin(x) + x/sqrt(1 - x^2)',
                calculatorFormula: 'x*asin(x)',
            },
        ],
        mistakesHeading: 'Mistakes that turn arcsin into cosecant',
        mistakes: [
            {
                title: 'Reading sin^-1(x) as 1/sin(x)',
                text: 'sin^-1(x) is arcsin(x). The reciprocal 1/sin(x) is csc(x), and its derivative is -csc(x) cot(x). That answer has vertical asymptotes at every multiple of π, which arcsin does not have.',
            },
            {
                title: 'Dropping the chain-rule factor on arcsin(2x)',
                text: '1/sqrt(1 - 4x^2) is missing the derivative of the inside. The factor 2 has to be squared inside the root and also multiplied outside. Squaring only the x, as in 1 - 2x^2, is the other version of the same slip.',
            },
            {
                title: 'Taking the negative square root',
                text: 'cos(y) = ±sqrt(1 - x^2). On the range of arcsin the cosine is positive, so the derivative of arcsin is positive for every x in (-1, 1). The negative formula is the derivative of arccos(x).',
            },
            {
                title: 'Plugging in the endpoints',
                text: 'At x = 1 and x = -1 the expression 1/sqrt(1 - x^2) divides by zero. Arcsin is defined at those points and the derivative is not. A numerical check at x = 0.999 gets large; it does not settle to a finite slope.',
            },
        ],
        relatedHeading: 'Related functions',
        related: [
            { href: '/derivative-of-arccos-x', label: 'Derivative of arccos(x)', note: 'The negative of this result, because arcsin(x) + arccos(x) = π/2.' },
            { href: '/derivative-of-arctan-x', label: 'Derivative of arctan(x)', note: '1/(1 + x^2), defined for every real number, not only (-1, 1).' },
            { href: '/derivative-of-sin-x', label: 'Derivative of sin(x)', note: 'cos(x). Arcsin inverts sine; it does not share this derivative.' },
            { href: hub, label: 'Derivatives of trigonometric functions', note: 'The six standard formulas next to the three inverse formulas.' },
        ],
        faqs: [
            {
                question: 'What is the derivative of sin^-1(x)?',
                answer: 'The derivative of sin^-1(x) is 1/sqrt(1 - x^2), for x strictly between -1 and 1. sin^-1(x) is another way to write arcsin(x).',
            },
            {
                question: 'Is the derivative of arcsin(x) the same as the derivative of 1/sin(x)?',
                answer: 'No. 1/sin(x) is csc(x), and its derivative is -csc(x) cot(x). The derivative of arcsin(x) is 1/sqrt(1 - x^2).',
            },
            {
                question: 'What is the domain of the derivative of arcsin(x)?',
                answer: 'The derivative 1/sqrt(1 - x^2) is defined on the open interval (-1, 1). Arcsin itself is also defined at x = ±1, but the tangent is vertical there.',
            },
            {
                question: 'How do you differentiate arcsin(2x)?',
                answer: 'Multiply 1/sqrt(1 - (2x)^2) by the inner derivative 2. The result is 2/sqrt(1 - 4x^2), and it requires |x| < 1/2.',
            },
        ],
    },
    'derivative-of-arccos-x': {
        slug: 'derivative-of-arccos-x',
        title: 'Derivative of arccos(x) (cos^-1 x)',
        description: 'The derivative of arccos(x), or cos^-1(x), is -1/sqrt(1-x^2). The minus sign is required. Proof and an arcsin check.',
        formulaHeading: 'Formula for arccos(x) and cos^-1(x)',
        formula: 'd/dx arccos(x) = d/dx cos^-1(x) = -1 / sqrt(1 - x^2), for -1 < x < 1.',
        formulaNote: 'The only difference from arcsin is the sign. That is not a convention: arccos decreases as x increases, so the slope has to be negative. The calculator is filled with acos(x).',
        calculatorFormula: 'acos(x)',
        calculatorLabel: 'Open arccos(x) in the derivative calculator',
        derivationHeading: 'Why the derivative of arccos is negative',
        derivation: [
            'Let y = arccos(x). Then y is the unique angle in [0, π] with cos(y) = x. Differentiating both sides, the chain rule produces -sin(y) · y\' = 1.',
            'Solving for y\' puts the minus sign in the numerator: y\' = -1/sin(y). On [0, π] the sine is non-negative, so sin(y) = sqrt(1 - cos^2(y)) = sqrt(1 - x^2). The negative sign stays in front of the root.',
            'There is a second proof that does not repeat that algebra. The identity arcsin(x) + arccos(x) = π/2 holds for every x in [-1, 1]. The derivative of a constant is 0, so the two derivatives add to 0. Once the derivative of arcsin is 1/sqrt(1 - x^2), the derivative of arccos is the negative of it.',
        ],
        derivationSteps: [
            'Set y = arccos(x), so cos(y) = x and y is in [0, π].',
            'Differentiate both sides: -sin(y) · dy/dx = 1.',
            'Solve: dy/dx = -1/sin(y).',
            'On [0, π], sin(y) ≥ 0, so sin(y) = sqrt(1 - cos^2(y)) = sqrt(1 - x^2).',
            'Conclude d/dx arccos(x) = -1/sqrt(1 - x^2), for -1 < x < 1.',
            'Check: add the derivative of arcsin(x). The sum is 0, matching arcsin(x) + arccos(x) = π/2.',
        ],
        examplesHeading: 'Worked examples that keep the minus sign',
        examples: [
            {
                title: 'Slope of arccos at the origin',
                steps: [
                    'Substitute x = 0 into -1/sqrt(1 - x^2).',
                    'The root is 1, so the slope is -1.',
                    'Arccos crosses π/2 at the origin and is decreasing, which matches a slope of -1.',
                ],
                answer: '-1',
                calculatorFormula: 'acos(x)',
            },
            {
                title: 'Derivative of arccos(3x)',
                steps: [
                    'Outer function: -1/sqrt(1 - u^2) with u = 3x.',
                    'Inner derivative: 3. Multiply, and square the 3 inside the root.',
                    '1 - 9x^2 is the radicand. The domain is |3x| < 1, so |x| < 1/3.',
                ],
                answer: '-3 / sqrt(1 - 9x^2), for |x| < 1/3',
                calculatorFormula: 'acos(3*x)',
            },
            {
                title: 'Derivative of x · arccos(x)',
                steps: [
                    'Product rule with u = x and v = arccos(x).',
                    'u\' = 1 and v\' = -1/sqrt(1 - x^2).',
                    'The second term is negative. Do not cancel it against the first.',
                ],
                answer: 'arccos(x) - x/sqrt(1 - x^2)',
                calculatorFormula: 'x*acos(x)',
            },
        ],
        mistakesHeading: 'Mistakes that erase the minus sign',
        mistakes: [
            {
                title: 'Copying the arcsin formula unchanged',
                text: 'Arcsin and arccos have opposite slopes. An answer of 1/sqrt(1 - x^2) for arccos fails the identity check: the derivatives would add to 2/sqrt(1 - x^2) instead of 0.',
            },
            {
                title: 'Treating cos^-1(x) as sec(x)',
                text: 'cos^-1(x) is arccos(x). The reciprocal of cosine is sec(x), whose derivative is sec(x) tan(x). Secant is undefined at π/2, where arccos is perfectly smooth.',
            },
            {
                title: 'Losing the 3 in arccos(3x)',
                text: 'The chain rule multiplies by 3 and replaces x^2 with (3x)^2 = 9x^2. Writing -1/sqrt(1 - 9x^2) keeps the inside correct and still drops the factor in front.',
            },
            {
                title: 'Using the formula outside (-1, 1)',
                text: 'arccos(2) is not a real number, and neither is -1/sqrt(1 - 4). The expression under the root has to be positive, so the input of arccos, including any inside function, has to lie strictly between -1 and 1.',
            },
        ],
        relatedHeading: 'Related functions',
        related: [
            { href: '/derivative-of-arcsin-x', label: 'Derivative of arcsin(x)', note: 'The same root with the opposite sign. Their sum is the derivative of π/2, which is 0.' },
            { href: '/derivative-of-arctan-x', label: 'Derivative of arctan(x)', note: '1/(1 + x^2). No square root, and no restriction to (-1, 1).' },
            { href: '/derivative-of-cos-x', label: 'Derivative of cos(x)', note: '-sin(x). That minus sign is the ordinary cosine rule, not this inverse rule.' },
            { href: hub, label: 'Derivatives of trigonometric functions', note: 'Sin through cot, then the three inverse functions, in one table.' },
        ],
        faqs: [
            {
                question: 'What is the derivative of arccos(x)?',
                answer: 'The derivative of arccos(x) is -1/sqrt(1 - x^2), for -1 < x < 1.',
            },
            {
                question: 'What is the derivative of cos^-1(x)?',
                answer: 'cos^-1(x) means arccos(x). Its derivative is -1/sqrt(1 - x^2), not the derivative of sec(x).',
            },
            {
                question: 'Why is the derivative of arccos negative?',
                answer: 'arccos decreases from π to 0 as x goes from -1 to 1, so every slope is negative. The identity arcsin(x) + arccos(x) = π/2 forces the two derivatives to be opposites.',
            },
            {
                question: 'How is the derivative of arccos related to arcsin?',
                answer: 'They add to zero. d/dx arccos(x) = - d/dx arcsin(x) = -1/sqrt(1 - x^2).',
            },
        ],
    },
    'derivative-of-arctan-x': {
        slug: 'derivative-of-arctan-x',
        title: 'Derivative of arctan(x) (tan^-1 x)',
        description: 'The derivative of arctan(x), tan^-1(x), and atan(x) is 1/(1+x^2) for every real x. Proof, arctan(2x), and the tan mix-up.',
        formulaHeading: 'Formula for arctan(x), tan^-1(x), and atan(x)',
        formula: 'd/dx arctan(x) = d/dx tan^-1(x) = d/dx atan(x) = 1 / (1 + x^2), for every real x.',
        formulaNote: 'Unlike arcsin and arccos, there is no square root and no gap in the domain. The derivative is always positive and it tends to 0 as x goes to either infinity, which matches the horizontal asymptotes of arctan. The calculator is filled with atan(x).',
        calculatorFormula: 'atan(x)',
        calculatorLabel: 'Open arctan(x) in the derivative calculator',
        derivationHeading: 'From tan(y) = x to 1/(1+x^2)',
        derivation: [
            'Let y = arctan(x), so tan(y) = x and y lies in (-π/2, π/2). Differentiating both sides uses the known derivative of tangent: sec^2(y) · y\' = 1.',
            'Thus y\' = 1/sec^2(y). The Pythagorean identity sec^2(y) = 1 + tan^2(y) rewrites the denominator without a trig function. Because tan(y) = x, the denominator is 1 + x^2.',
            'The result 1/(1 + x^2) is defined for every real x. It is also the derivative of tan^-1(x) and of atan(x); those are names for the same function. It is not the derivative of tan(x), which is sec^2(x) and which is undefined at odd multiples of π/2.',
        ],
        derivationSteps: [
            'Set y = arctan(x), so tan(y) = x and y is in (-π/2, π/2).',
            'Differentiate both sides: sec^2(y) · dy/dx = 1.',
            'Solve: dy/dx = 1/sec^2(y).',
            'Use sec^2(y) = 1 + tan^2(y).',
            'Replace tan(y) with x: sec^2(y) = 1 + x^2.',
            'Conclude d/dx arctan(x) = 1/(1 + x^2), for every real x.',
        ],
        examplesHeading: 'Worked examples, including d/dx atan(2x)',
        examples: [
            {
                title: 'd/dx atan(x) at x = 1',
                steps: [
                    'atan(x) is arctan(x). The derivative is 1/(1 + x^2).',
                    'At x = 1 the denominator is 1 + 1 = 2.',
                    'The slope is 1/2. Arctan(1) = π/4, and the tangent there is not horizontal.',
                ],
                answer: '1/2',
                calculatorFormula: 'atan(x)',
            },
            {
                title: 'Derivative of arctan(2x)',
                steps: [
                    'Outer derivative: 1/(1 + u^2) with u = 2x.',
                    'Inner derivative: 2. The chain rule multiplies by 2 and squares the 2 inside.',
                    '1 + (2x)^2 = 1 + 4x^2. There is no domain restriction.',
                ],
                answer: '2 / (1 + 4x^2)',
                calculatorFormula: 'atan(2*x)',
            },
            {
                title: 'Derivative of arctan(x) + arctan(1/x) for x > 0',
                steps: [
                    'For x > 0 the sum arctan(x) + arctan(1/x) equals π/2, a constant.',
                    'Differentiating confirms it: 1/(1 + x^2) plus the chain rule on arctan(1/x).',
                    'The second term is [1/(1 + 1/x^2)] · (-1/x^2) = -1/(1 + x^2).',
                    'The terms cancel. A nonzero answer means the derivative of 1/x was forgotten.',
                ],
                answer: '0, for x > 0',
                calculatorFormula: 'atan(x)+atan(1/x)',
            },
        ],
        mistakesHeading: 'Mistakes that swap arctan with tan',
        mistakes: [
            {
                title: 'Answering sec^2(x)',
                text: 'sec^2(x) is the derivative of tan(x). The derivative of arctan(x) is the rational function 1/(1 + x^2). One is unbounded near π/2; the other never exceeds 1.',
            },
            {
                title: 'Writing 1/(1 - x^2)',
                text: 'The denominator is 1 plus x^2, because the identity is sec^2 = 1 + tan^2. A minus sign in the denominator is a different function (it shows up for artanh, not arctan) and it is undefined at x = ±1, where arctan is fine.',
            },
            {
                title: 'Chain rule on arctan(2x)',
                text: 'Two errors are common. Dropping the 2 gives 1/(1 + 4x^2). Forgetting to square the 2 gives 2/(1 + 2x^2). The derivative of the inside is 2, and (2x)^2 is 4x^2, so the answer is 2/(1 + 4x^2).',
            },
            {
                title: 'Restricting the domain to (-1, 1)',
                text: 'That restriction belongs to arcsin and arccos. Arctan accepts every real input, and 1 + x^2 is never zero, so the derivative has the same domain as the function.',
            },
        ],
        relatedHeading: 'Related functions',
        related: [
            { href: '/derivative-of-arcsin-x', label: 'Derivative of arcsin(x)', note: '1/sqrt(1 - x^2), only on (-1, 1). The query sin^-1(x) belongs on that page.' },
            { href: '/derivative-of-arccos-x', label: 'Derivative of arccos(x)', note: 'The negative root. Arctan does not pair with it by a constant sum on the whole line.' },
            { href: '/derivative-of-tan-x', label: 'Derivative of tan(x)', note: 'sec^2(x). This is the function arctan inverts, and the derivatives are not reciprocals of each other.' },
            { href: hub, label: 'Derivatives of trigonometric functions', note: 'The standard six and the inverse three, with the chain-rule variants beside them.' },
        ],
        faqs: [
            {
                question: 'What is the derivative of tan^-1(x)?',
                answer: 'The derivative of tan^-1(x) is 1/(1 + x^2). tan^-1(x) means arctan(x), not 1/tan(x).',
            },
            {
                question: 'What is d/dx atan(x)?',
                answer: 'atan(x) is the same function as arctan(x). d/dx atan(x) = 1/(1 + x^2), for every real x.',
            },
            {
                question: 'What is the derivative of arctan(2x)?',
                answer: 'By the chain rule it is 2/(1 + (2x)^2), which simplifies to 2/(1 + 4x^2).',
            },
            {
                question: 'Is the derivative of arctan(x) equal to sec^2(x)?',
                answer: 'No. sec^2(x) is the derivative of tan(x). The derivative of arctan(x) is 1/(1 + x^2).',
            },
        ],
    },
};

const es: Record<InverseTrigSlug, InverseTrigLesson> = {
    'derivative-of-arcsin-x': {
        slug: 'derivative-of-arcsin-x',
        title: 'Derivada de arcsen(x) (sen^-1 x)',
        description: 'La derivada de arcsen(x), o sen^-1(x), es 1/sqrt(1-x^2) en (-1, 1). Demostración, ejemplos y la confusión con csc.',
        formulaHeading: 'Fórmula de arcsen(x) y sen^-1(x)',
        formula: 'd/dx arcsen(x) = d/dx sen^-1(x) = 1 / sqrt(1 - x^2), para -1 < x < 1.',
        formulaNote: 'En x = ±1 la gráfica de arcsen tiene tangente vertical, así que ahí la derivada no es un número real. La calculadora de esta página ya trae asin(x), que es la misma función. sen(x) y sin(x) también son la misma.',
        calculatorFormula: 'asin(x)',
        calculatorLabel: 'Abrir arcsen(x) en la calculadora de derivadas',
        derivationHeading: 'Diferenciación implícita que da 1/sqrt(1-x^2)',
        derivation: [
            'Sea y = arcsen(x). Por definición, y es el único ángulo de [-π/2, π/2] cuyo seno es x, de modo que sen(y) = x. Derivar esa ecuación es más corto que derivar la inversa desde la definición por límite.',
            'El lado izquierdo es una composición. La regla de la cadena da cos(y) · y\'. El lado derecho es la recta y = x, cuya derivada es 1. Despejar es una división: y\' = 1/cos(y), siempre que cos(y) no sea cero.',
            'El coseno es no negativo en el recorrido de arcsen. Eso elige la raíz positiva: cos(y) = sqrt(1 - sen^2(y)) = sqrt(1 - x^2). Sustituirla es toda la demostración. La misma expresión es la derivada de sen^-1(x); la notación no cambia la función.',
        ],
        derivationSteps: [
            'Poner y = arcsen(x), así sen(y) = x e y está en [-π/2, π/2].',
            'Derivar ambos lados: cos(y) · dy/dx = 1.',
            'Despejar: dy/dx = 1/cos(y).',
            'Como y permanece en [-π/2, π/2], cos(y) ≥ 0, luego cos(y) = sqrt(1 - sen^2(y)).',
            'Reemplazar sen(y) por x: cos(y) = sqrt(1 - x^2).',
            'Concluir d/dx arcsen(x) = 1/sqrt(1 - x^2), para -1 < x < 1.',
        ],
        examplesHeading: 'Ejemplos resueltos, incluido arcsen de un múltiplo',
        examples: [
            {
                title: 'Pendiente de arcsen en el origen',
                steps: [
                    'Sustituir x = 0 en 1/sqrt(1 - x^2).',
                    'El interior de la raíz es 1, y sqrt(1) = 1.',
                    'La pendiente es 1. Cerca de cero, arcsen(x) y la recta y = x comparten tangente.',
                ],
                answer: '1',
                calculatorFormula: 'asin(x)',
            },
            {
                title: 'Derivada de arcsen(2x)',
                steps: [
                    'La derivada exterior es 1/sqrt(1 - u^2) con u = 2x.',
                    'La derivada interior es 2. La regla de la cadena las multiplica.',
                    '1 - (2x)^2 = 1 - 4x^2, así que el resultado es 2/sqrt(1 - 4x^2).',
                    'El dominio se reduce: |2x| < 1, es decir |x| < 1/2.',
                ],
                answer: '2 / sqrt(1 - 4x^2), para |x| < 1/2',
                calculatorFormula: 'asin(2*x)',
            },
            {
                title: 'Derivada de x · arcsen(x)',
                steps: [
                    'Es un producto. Usar (uv)\' = u\'v + uv\' con u = x y v = arcsen(x).',
                    'u\' = 1 y v\' = 1/sqrt(1 - x^2).',
                    'Los dos términos son arcsen(x) y x/sqrt(1 - x^2). Los dos se quedan.',
                ],
                answer: 'arcsen(x) + x/sqrt(1 - x^2)',
                calculatorFormula: 'x*asin(x)',
            },
        ],
        mistakesHeading: 'Errores que convierten arcsen en cosecante',
        mistakes: [
            {
                title: 'Leer sen^-1(x) como 1/sen(x)',
                text: 'sen^-1(x) es arcsen(x). El recíproco 1/sen(x) es csc(x), y su derivada es -csc(x) cot(x). Esa respuesta tiene asíntotas verticales en cada múltiplo de π; arcsen no las tiene.',
            },
            {
                title: 'Olvidar el factor de la cadena en arcsen(2x)',
                text: '1/sqrt(1 - 4x^2) no incluye la derivada del interior. El 2 tiene que elevarse al cuadrado dentro de la raíz y también multiplicar fuera. Elevar al cuadrado solo la x, como en 1 - 2x^2, es la otra forma del mismo error.',
            },
            {
                title: 'Tomar la raíz negativa',
                text: 'cos(y) = ±sqrt(1 - x^2). En el recorrido de arcsen el coseno es positivo, así que la derivada de arcsen es positiva en todo (-1, 1). La fórmula negativa es la derivada de arccos(x).',
            },
            {
                title: 'Evaluar en los extremos',
                text: 'En x = 1 y x = -1 la expresión 1/sqrt(1 - x^2) divide por cero. Arcsen está definido en esos puntos y la derivada no. Un chequeo numérico en x = 0,999 se hace grande; no se estabiliza en una pendiente finita.',
            },
        ],
        relatedHeading: 'Funciones relacionadas',
        related: [
            { href: '/derivative-of-arccos-x', label: 'Derivada de arccos(x)', note: 'El negativo de este resultado, porque arcsen(x) + arccos(x) = π/2.' },
            { href: '/derivative-of-arctan-x', label: 'Derivada de arctan(x)', note: '1/(1 + x^2), definida para todo real, no solo en (-1, 1).' },
            { href: '/derivative-of-sin-x', label: 'Derivada de sen(x)', note: 'cos(x). Arcsen invierte el seno; no comparte esta derivada.' },
            { href: hub, label: 'Derivadas de funciones trigonométricas', note: 'Las seis fórmulas usuales junto a las tres inversas.' },
        ],
        faqs: [
            {
                question: '¿Cuál es la derivada de sen^-1(x)?',
                answer: 'La derivada de sen^-1(x) es 1/sqrt(1 - x^2), para x estrictamente entre -1 y 1. sen^-1(x) es otra forma de escribir arcsen(x).',
            },
            {
                question: '¿La derivada de arcsen(x) es la misma que la de 1/sen(x)?',
                answer: 'No. 1/sen(x) es csc(x), y su derivada es -csc(x) cot(x). La derivada de arcsen(x) es 1/sqrt(1 - x^2).',
            },
            {
                question: '¿Cuál es el dominio de la derivada de arcsen(x)?',
                answer: 'La derivada 1/sqrt(1 - x^2) está definida en el intervalo abierto (-1, 1). Arcsen también está definido en x = ±1, pero ahí la tangente es vertical.',
            },
            {
                question: '¿Cómo se deriva arcsen(2x)?',
                answer: 'Se multiplica 1/sqrt(1 - (2x)^2) por la derivada interior 2. El resultado es 2/sqrt(1 - 4x^2), y exige |x| < 1/2.',
            },
        ],
    },
    'derivative-of-arccos-x': {
        slug: 'derivative-of-arccos-x',
        title: 'Derivada de arccos(x) (cos^-1 x)',
        description: 'La derivada de arccos(x), o cos^-1(x), es -1/sqrt(1-x^2). El signo menos es obligatorio. Demostración y chequeo con arcsen.',
        formulaHeading: 'Fórmula de arccos(x) y cos^-1(x)',
        formula: 'd/dx arccos(x) = d/dx cos^-1(x) = -1 / sqrt(1 - x^2), para -1 < x < 1.',
        formulaNote: 'La única diferencia con arcsen es el signo. No es una convención: arccos decrece cuando x crece, así que la pendiente tiene que ser negativa. La calculadora trae acos(x).',
        calculatorFormula: 'acos(x)',
        calculatorLabel: 'Abrir arccos(x) en la calculadora de derivadas',
        derivationHeading: 'Por qué la derivada de arccos es negativa',
        derivation: [
            'Sea y = arccos(x). Entonces y es el único ángulo de [0, π] con cos(y) = x. Al derivar ambos lados, la regla de la cadena produce -sen(y) · y\' = 1.',
            'Despejar y\' deja el signo menos en el numerador: y\' = -1/sen(y). En [0, π] el seno es no negativo, así que sen(y) = sqrt(1 - cos^2(y)) = sqrt(1 - x^2). El signo negativo permanece delante de la raíz.',
            'Hay una segunda prueba que no repite ese álgebra. La identidad arcsen(x) + arccos(x) = π/2 vale para todo x de [-1, 1]. La derivada de una constante es 0, así que las dos derivadas suman 0. Si la de arcsen es 1/sqrt(1 - x^2), la de arccos es su negativa.',
        ],
        derivationSteps: [
            'Poner y = arccos(x), así cos(y) = x e y está en [0, π].',
            'Derivar ambos lados: -sen(y) · dy/dx = 1.',
            'Despejar: dy/dx = -1/sen(y).',
            'En [0, π], sen(y) ≥ 0, luego sen(y) = sqrt(1 - cos^2(y)) = sqrt(1 - x^2).',
            'Concluir d/dx arccos(x) = -1/sqrt(1 - x^2), para -1 < x < 1.',
            'Chequeo: sumar la derivada de arcsen(x). La suma es 0, como corresponde a arcsen(x) + arccos(x) = π/2.',
        ],
        examplesHeading: 'Ejemplos que conservan el signo menos',
        examples: [
            {
                title: 'Pendiente de arccos en el origen',
                steps: [
                    'Sustituir x = 0 en -1/sqrt(1 - x^2).',
                    'La raíz es 1, así que la pendiente es -1.',
                    'Arccos pasa por π/2 en el origen y es decreciente, lo que coincide con pendiente -1.',
                ],
                answer: '-1',
                calculatorFormula: 'acos(x)',
            },
            {
                title: 'Derivada de arccos(3x)',
                steps: [
                    'Función exterior: -1/sqrt(1 - u^2) con u = 3x.',
                    'Derivada interior: 3. Multiplicar, y elevar el 3 al cuadrado dentro de la raíz.',
                    '1 - 9x^2 es el radicando. El dominio es |3x| < 1, o sea |x| < 1/3.',
                ],
                answer: '-3 / sqrt(1 - 9x^2), para |x| < 1/3',
                calculatorFormula: 'acos(3*x)',
            },
            {
                title: 'Derivada de x · arccos(x)',
                steps: [
                    'Regla del producto con u = x y v = arccos(x).',
                    'u\' = 1 y v\' = -1/sqrt(1 - x^2).',
                    'El segundo término es negativo. No se cancela con el primero.',
                ],
                answer: 'arccos(x) - x/sqrt(1 - x^2)',
                calculatorFormula: 'x*acos(x)',
            },
        ],
        mistakesHeading: 'Errores que borran el signo menos',
        mistakes: [
            {
                title: 'Copiar la fórmula de arcsen sin cambio',
                text: 'Arcsen y arccos tienen pendientes opuestas. Una respuesta 1/sqrt(1 - x^2) para arccos falla el chequeo de la identidad: las derivadas sumarían 2/sqrt(1 - x^2) en lugar de 0.',
            },
            {
                title: 'Tratar cos^-1(x) como sec(x)',
                text: 'cos^-1(x) es arccos(x). El recíproco del coseno es sec(x), cuya derivada es sec(x) tan(x). La secante no está definida en π/2, donde arccos es perfectamente suave.',
            },
            {
                title: 'Perder el 3 en arccos(3x)',
                text: 'La regla de la cadena multiplica por 3 y sustituye x^2 por (3x)^2 = 9x^2. Escribir -1/sqrt(1 - 9x^2) deja bien el interior y aun así omite el factor de delante.',
            },
            {
                title: 'Usar la fórmula fuera de (-1, 1)',
                text: 'arccos(2) no es real, y -1/sqrt(1 - 4) tampoco. Lo que está bajo la raíz tiene que ser positivo, así que la entrada de arccos, incluida cualquier función interior, tiene que estar estrictamente entre -1 y 1.',
            },
        ],
        relatedHeading: 'Funciones relacionadas',
        related: [
            { href: '/derivative-of-arcsin-x', label: 'Derivada de arcsen(x)', note: 'La misma raíz con el signo opuesto. Su suma es la derivada de π/2, que es 0.' },
            { href: '/derivative-of-arctan-x', label: 'Derivada de arctan(x)', note: '1/(1 + x^2). Sin raíz cuadrada y sin restricción a (-1, 1).' },
            { href: '/derivative-of-cos-x', label: 'Derivada de cos(x)', note: '-sen(x). Ese signo menos es la regla del coseno, no esta regla inversa.' },
            { href: hub, label: 'Derivadas de funciones trigonométricas', note: 'De sen a cot, y después las tres inversas, en una tabla.' },
        ],
        faqs: [
            {
                question: '¿Cuál es la derivada de arccos(x)?',
                answer: 'La derivada de arccos(x) es -1/sqrt(1 - x^2), para -1 < x < 1.',
            },
            {
                question: '¿Cuál es la derivada de cos^-1(x)?',
                answer: 'cos^-1(x) significa arccos(x). Su derivada es -1/sqrt(1 - x^2), no la derivada de sec(x).',
            },
            {
                question: '¿Por qué la derivada de arccos es negativa?',
                answer: 'arccos decrece de π a 0 cuando x va de -1 a 1, así que toda pendiente es negativa. La identidad arcsen(x) + arccos(x) = π/2 obliga a que las dos derivadas sean opuestas.',
            },
            {
                question: '¿Cómo se relaciona la derivada de arccos con la de arcsen?',
                answer: 'Suman cero. d/dx arccos(x) = - d/dx arcsen(x) = -1/sqrt(1 - x^2).',
            },
        ],
    },
    'derivative-of-arctan-x': {
        slug: 'derivative-of-arctan-x',
        title: 'Derivada de arctan(x) (tan^-1 x)',
        description: 'La derivada de arctan(x), tan^-1(x) y atan(x) es 1/(1+x^2) para todo real. Demostración, arctan(2x) y la confusión con tan.',
        formulaHeading: 'Fórmula de arctan(x), tan^-1(x) y atan(x)',
        formula: 'd/dx arctan(x) = d/dx tan^-1(x) = d/dx atan(x) = 1 / (1 + x^2), para todo x real.',
        formulaNote: 'A diferencia de arcsen y arccos, no hay raíz cuadrada ni hueco en el dominio. La derivada siempre es positiva y tiende a 0 cuando x va a cualquiera de los dos infinitos, igual que las asíntotas horizontales de arctan. La calculadora trae atan(x).',
        calculatorFormula: 'atan(x)',
        calculatorLabel: 'Abrir arctan(x) en la calculadora de derivadas',
        derivationHeading: 'De tan(y) = x a 1/(1+x^2)',
        derivation: [
            'Sea y = arctan(x), de modo que tan(y) = x e y está en (-π/2, π/2). Derivar ambos lados usa la derivada conocida de la tangente: sec^2(y) · y\' = 1.',
            'Así y\' = 1/sec^2(y). La identidad pitagórica sec^2(y) = 1 + tan^2(y) reescribe el denominador sin función trigonométrica. Como tan(y) = x, el denominador es 1 + x^2.',
            'El resultado 1/(1 + x^2) está definido para todo real. También es la derivada de tan^-1(x) y de atan(x); son nombres de la misma función. No es la derivada de tan(x), que es sec^2(x) y no está definida en los múltiplos impares de π/2.',
        ],
        derivationSteps: [
            'Poner y = arctan(x), así tan(y) = x e y está en (-π/2, π/2).',
            'Derivar ambos lados: sec^2(y) · dy/dx = 1.',
            'Despejar: dy/dx = 1/sec^2(y).',
            'Usar sec^2(y) = 1 + tan^2(y).',
            'Reemplazar tan(y) por x: sec^2(y) = 1 + x^2.',
            'Concluir d/dx arctan(x) = 1/(1 + x^2), para todo x real.',
        ],
        examplesHeading: 'Ejemplos resueltos, incluido d/dx atan(2x)',
        examples: [
            {
                title: 'd/dx atan(x) en x = 1',
                steps: [
                    'atan(x) es arctan(x). La derivada es 1/(1 + x^2).',
                    'En x = 1 el denominador es 1 + 1 = 2.',
                    'La pendiente es 1/2. Arctan(1) = π/4, y la tangente ahí no es horizontal.',
                ],
                answer: '1/2',
                calculatorFormula: 'atan(x)',
            },
            {
                title: 'Derivada de arctan(2x)',
                steps: [
                    'Derivada exterior: 1/(1 + u^2) con u = 2x.',
                    'Derivada interior: 2. La cadena multiplica por 2 y eleva el 2 al cuadrado dentro.',
                    '1 + (2x)^2 = 1 + 4x^2. No hay restricción de dominio.',
                ],
                answer: '2 / (1 + 4x^2)',
                calculatorFormula: 'atan(2*x)',
            },
            {
                title: 'Derivada de arctan(x) + arctan(1/x) para x > 0',
                steps: [
                    'Para x > 0 la suma arctan(x) + arctan(1/x) es π/2, una constante.',
                    'Derivar lo confirma: 1/(1 + x^2) más la cadena sobre arctan(1/x).',
                    'El segundo término es [1/(1 + 1/x^2)] · (-1/x^2) = -1/(1 + x^2).',
                    'Los términos se cancelan. Una respuesta distinta de cero significa que se olvidó la derivada de 1/x.',
                ],
                answer: '0, para x > 0',
                calculatorFormula: 'atan(x)+atan(1/x)',
            },
        ],
        mistakesHeading: 'Errores que cambian arctan por tan',
        mistakes: [
            {
                title: 'Responder sec^2(x)',
                text: 'sec^2(x) es la derivada de tan(x). La derivada de arctan(x) es la función racional 1/(1 + x^2). Una no está acotada cerca de π/2; la otra nunca pasa de 1.',
            },
            {
                title: 'Escribir 1/(1 - x^2)',
                text: 'El denominador es 1 más x^2, porque la identidad es sec^2 = 1 + tan^2. Un menos en el denominador es otra función (aparece en artanh, no en arctan) y no está definido en x = ±1, donde arctan sí lo está.',
            },
            {
                title: 'Regla de la cadena en arctan(2x)',
                text: 'Hay dos errores frecuentes. Olvidar el 2 da 1/(1 + 4x^2). No elevar el 2 al cuadrado da 2/(1 + 2x^2). La derivada del interior es 2, y (2x)^2 es 4x^2, así que la respuesta es 2/(1 + 4x^2).',
            },
            {
                title: 'Restringir el dominio a (-1, 1)',
                text: 'Esa restricción es de arcsen y arccos. Arctan acepta cualquier real, y 1 + x^2 nunca es cero, así que la derivada tiene el mismo dominio que la función.',
            },
        ],
        relatedHeading: 'Funciones relacionadas',
        related: [
            { href: '/derivative-of-arcsin-x', label: 'Derivada de arcsen(x)', note: '1/sqrt(1 - x^2), solo en (-1, 1). La búsqueda sen^-1(x) corresponde a esa página.' },
            { href: '/derivative-of-arccos-x', label: 'Derivada de arccos(x)', note: 'La raíz negativa. Arctan no forma con ella una suma constante en toda la recta.' },
            { href: '/derivative-of-tan-x', label: 'Derivada de tan(x)', note: 'sec^2(x). Es la función que arctan invierte, y las derivadas no son recíprocas entre sí.' },
            { href: hub, label: 'Derivadas de funciones trigonométricas', note: 'Las seis usuales y las tres inversas, con las variantes de la cadena al lado.' },
        ],
        faqs: [
            {
                question: '¿Cuál es la derivada de tan^-1(x)?',
                answer: 'La derivada de tan^-1(x) es 1/(1 + x^2). tan^-1(x) significa arctan(x), no 1/tan(x).',
            },
            {
                question: '¿Cuánto es d/dx atan(x)?',
                answer: 'atan(x) es la misma función que arctan(x). d/dx atan(x) = 1/(1 + x^2), para todo x real.',
            },
            {
                question: '¿Cuál es la derivada de arctan(2x)?',
                answer: 'Por la regla de la cadena es 2/(1 + (2x)^2), que se simplifica a 2/(1 + 4x^2).',
            },
            {
                question: '¿La derivada de arctan(x) es sec^2(x)?',
                answer: 'No. sec^2(x) es la derivada de tan(x). La derivada de arctan(x) es 1/(1 + x^2).',
            },
        ],
    },
};

const pt: Record<InverseTrigSlug, InverseTrigLesson> = {
    'derivative-of-arcsin-x': {
        slug: 'derivative-of-arcsin-x',
        title: 'Derivada de arcsen(x) (sen^-1 x)',
        description: 'A derivada de arcsen(x), ou sen^-1(x), é 1/sqrt(1-x^2) em (-1, 1). Prova, exemplos e a confusão com csc.',
        formulaHeading: 'Fórmula de arcsen(x) e sen^-1(x)',
        formula: 'd/dx arcsen(x) = d/dx sen^-1(x) = 1 / sqrt(1 - x^2), para -1 < x < 1.',
        formulaNote: 'Em x = ±1 o gráfico de arcsen tem tangente vertical, então a derivada não é um número real ali. A calculadora desta página já vem com asin(x), que é a mesma função. sen(x) e sin(x) também são a mesma.',
        calculatorFormula: 'asin(x)',
        calculatorLabel: 'Abrir arcsen(x) na calculadora de derivadas',
        derivationHeading: 'Diferenciação implícita que produz 1/sqrt(1-x^2)',
        derivation: [
            'Seja y = arcsen(x). Por definição, y é o único ângulo em [-π/2, π/2] cujo seno é x, logo sen(y) = x. Derivar essa equação é mais curto do que derivar a inversa pela definição de limite.',
            'O lado esquerdo é uma composição. A regra da cadeia dá cos(y) · y\'. O lado direito é a reta y = x, cuja derivada é 1. Isolar é uma divisão: y\' = 1/cos(y), desde que cos(y) não seja zero.',
            'O cosseno é não negativo na imagem de arcsen. Isso escolhe a raiz positiva: cos(y) = sqrt(1 - sen^2(y)) = sqrt(1 - x^2). Substituí-la é a prova inteira. A mesma expressão é a derivada de sen^-1(x); a notação não muda a função.',
        ],
        derivationSteps: [
            'Definir y = arcsen(x), de modo que sen(y) = x e y está em [-π/2, π/2].',
            'Derivar os dois lados: cos(y) · dy/dx = 1.',
            'Isolar: dy/dx = 1/cos(y).',
            'Como y permanece em [-π/2, π/2], cos(y) ≥ 0, logo cos(y) = sqrt(1 - sen^2(y)).',
            'Trocar sen(y) por x: cos(y) = sqrt(1 - x^2).',
            'Concluir d/dx arcsen(x) = 1/sqrt(1 - x^2), para -1 < x < 1.',
        ],
        examplesHeading: 'Exemplos resolvidos, inclusive arcsen de um múltiplo',
        examples: [
            {
                title: 'Inclinação de arcsen na origem',
                steps: [
                    'Substituir x = 0 em 1/sqrt(1 - x^2).',
                    'O interior da raiz é 1, e sqrt(1) = 1.',
                    'A inclinação é 1. Perto de zero, arcsen(x) e a reta y = x compartilham a tangente.',
                ],
                answer: '1',
                calculatorFormula: 'asin(x)',
            },
            {
                title: 'Derivada de arcsen(2x)',
                steps: [
                    'A derivada externa é 1/sqrt(1 - u^2) com u = 2x.',
                    'A derivada interna é 2. A regra da cadeia multiplica as duas.',
                    '1 - (2x)^2 = 1 - 4x^2, então o resultado é 2/sqrt(1 - 4x^2).',
                    'O domínio encolhe: |2x| < 1, ou seja |x| < 1/2.',
                ],
                answer: '2 / sqrt(1 - 4x^2), para |x| < 1/2',
                calculatorFormula: 'asin(2*x)',
            },
            {
                title: 'Derivada de x · arcsen(x)',
                steps: [
                    'É um produto. Usar (uv)\' = u\'v + uv\' com u = x e v = arcsen(x).',
                    'u\' = 1 e v\' = 1/sqrt(1 - x^2).',
                    'Os dois termos são arcsen(x) e x/sqrt(1 - x^2). Os dois ficam na resposta.',
                ],
                answer: 'arcsen(x) + x/sqrt(1 - x^2)',
                calculatorFormula: 'x*asin(x)',
            },
        ],
        mistakesHeading: 'Erros que transformam arcsen em cossecante',
        mistakes: [
            {
                title: 'Ler sen^-1(x) como 1/sen(x)',
                text: 'sen^-1(x) é arcsen(x). O recíproco 1/sen(x) é csc(x), e a derivada dele é -csc(x) cot(x). Essa resposta tem assíntotas verticais em cada múltiplo de π; arcsen não tem.',
            },
            {
                title: 'Esquecer o fator da cadeia em arcsen(2x)',
                text: '1/sqrt(1 - 4x^2) não inclui a derivada do interior. O 2 tem de ser elevado ao quadrado dentro da raiz e também multiplicar fora. Elevar só o x, como em 1 - 2x^2, é a outra forma do mesmo deslize.',
            },
            {
                title: 'Tomar a raiz negativa',
                text: 'cos(y) = ±sqrt(1 - x^2). Na imagem de arcsen o cosseno é positivo, então a derivada de arcsen é positiva em todo (-1, 1). A fórmula negativa é a derivada de arccos(x).',
            },
            {
                title: 'Calcular nos extremos',
                text: 'Em x = 1 e x = -1 a expressão 1/sqrt(1 - x^2) divide por zero. Arcsen está definido nesses pontos e a derivada não. Uma checagem numérica em x = 0,999 fica grande; não se acomoda numa inclinação finita.',
            },
        ],
        relatedHeading: 'Funções relacionadas',
        related: [
            { href: '/derivative-of-arccos-x', label: 'Derivada de arccos(x)', note: 'O negativo deste resultado, porque arcsen(x) + arccos(x) = π/2.' },
            { href: '/derivative-of-arctan-x', label: 'Derivada de arctan(x)', note: '1/(1 + x^2), definida para todo real, não só em (-1, 1).' },
            { href: '/derivative-of-sin-x', label: 'Derivada de sen(x)', note: 'cos(x). Arcsen inverte o seno; não compartilha esta derivada.' },
            { href: hub, label: 'Derivadas das funções trigonométricas', note: 'As seis fórmulas usuais ao lado das três inversas.' },
        ],
        faqs: [
            {
                question: 'Qual é a derivada de sen^-1(x)?',
                answer: 'A derivada de sen^-1(x) é 1/sqrt(1 - x^2), para x estritamente entre -1 e 1. sen^-1(x) é outro jeito de escrever arcsen(x).',
            },
            {
                question: 'A derivada de arcsen(x) é a mesma da de 1/sen(x)?',
                answer: 'Não. 1/sen(x) é csc(x), e a derivada dele é -csc(x) cot(x). A derivada de arcsen(x) é 1/sqrt(1 - x^2).',
            },
            {
                question: 'Qual é o domínio da derivada de arcsen(x)?',
                answer: 'A derivada 1/sqrt(1 - x^2) está definida no intervalo aberto (-1, 1). Arcsen também está definido em x = ±1, mas a tangente é vertical ali.',
            },
            {
                question: 'Como derivar arcsen(2x)?',
                answer: 'Multiplica-se 1/sqrt(1 - (2x)^2) pela derivada interna 2. O resultado é 2/sqrt(1 - 4x^2), e exige |x| < 1/2.',
            },
        ],
    },
    'derivative-of-arccos-x': {
        slug: 'derivative-of-arccos-x',
        title: 'Derivada de arccos(x) (cos^-1 x)',
        description: 'A derivada de arccos(x), ou cos^-1(x), é -1/sqrt(1-x^2). O sinal de menos é obrigatório. Prova e checagem com arcsen.',
        formulaHeading: 'Fórmula de arccos(x) e cos^-1(x)',
        formula: 'd/dx arccos(x) = d/dx cos^-1(x) = -1 / sqrt(1 - x^2), para -1 < x < 1.',
        formulaNote: 'A única diferença em relação a arcsen é o sinal. Não é convenção: arccos diminui quando x aumenta, então a inclinação tem de ser negativa. A calculadora vem com acos(x).',
        calculatorFormula: 'acos(x)',
        calculatorLabel: 'Abrir arccos(x) na calculadora de derivadas',
        derivationHeading: 'Por que a derivada de arccos é negativa',
        derivation: [
            'Seja y = arccos(x). Então y é o único ângulo em [0, π] com cos(y) = x. Ao derivar os dois lados, a regra da cadeia produz -sen(y) · y\' = 1.',
            'Isolar y\' põe o sinal de menos no numerador: y\' = -1/sen(y). Em [0, π] o seno é não negativo, logo sen(y) = sqrt(1 - cos^2(y)) = sqrt(1 - x^2). O sinal negativo fica na frente da raiz.',
            'Há uma segunda prova que não repete essa álgebra. A identidade arcsen(x) + arccos(x) = π/2 vale para todo x em [-1, 1]. A derivada de uma constante é 0, então as duas derivadas somam 0. Se a de arcsen é 1/sqrt(1 - x^2), a de arccos é o negativo dela.',
        ],
        derivationSteps: [
            'Definir y = arccos(x), de modo que cos(y) = x e y está em [0, π].',
            'Derivar os dois lados: -sen(y) · dy/dx = 1.',
            'Isolar: dy/dx = -1/sen(y).',
            'Em [0, π], sen(y) ≥ 0, logo sen(y) = sqrt(1 - cos^2(y)) = sqrt(1 - x^2).',
            'Concluir d/dx arccos(x) = -1/sqrt(1 - x^2), para -1 < x < 1.',
            'Checagem: somar a derivada de arcsen(x). A soma é 0, como pede arcsen(x) + arccos(x) = π/2.',
        ],
        examplesHeading: 'Exemplos que preservam o sinal de menos',
        examples: [
            {
                title: 'Inclinação de arccos na origem',
                steps: [
                    'Substituir x = 0 em -1/sqrt(1 - x^2).',
                    'A raiz é 1, então a inclinação é -1.',
                    'Arccos passa por π/2 na origem e é decrescente, o que combina com inclinação -1.',
                ],
                answer: '-1',
                calculatorFormula: 'acos(x)',
            },
            {
                title: 'Derivada de arccos(3x)',
                steps: [
                    'Função externa: -1/sqrt(1 - u^2) com u = 3x.',
                    'Derivada interna: 3. Multiplicar, e elevar o 3 ao quadrado dentro da raiz.',
                    '1 - 9x^2 é o radicando. O domínio é |3x| < 1, ou seja |x| < 1/3.',
                ],
                answer: '-3 / sqrt(1 - 9x^2), para |x| < 1/3',
                calculatorFormula: 'acos(3*x)',
            },
            {
                title: 'Derivada de x · arccos(x)',
                steps: [
                    'Regra do produto com u = x e v = arccos(x).',
                    'u\' = 1 e v\' = -1/sqrt(1 - x^2).',
                    'O segundo termo é negativo. Não se cancela com o primeiro.',
                ],
                answer: 'arccos(x) - x/sqrt(1 - x^2)',
                calculatorFormula: 'x*acos(x)',
            },
        ],
        mistakesHeading: 'Erros que apagam o sinal de menos',
        mistakes: [
            {
                title: 'Copiar a fórmula de arcsen sem mudança',
                text: 'Arcsen e arccos têm inclinações opostas. Uma resposta 1/sqrt(1 - x^2) para arccos falha a checagem da identidade: as derivadas somariam 2/sqrt(1 - x^2) em vez de 0.',
            },
            {
                title: 'Tratar cos^-1(x) como sec(x)',
                text: 'cos^-1(x) é arccos(x). O recíproco do cosseno é sec(x), cuja derivada é sec(x) tan(x). A secante não está definida em π/2, onde arccos é perfeitamente suave.',
            },
            {
                title: 'Perder o 3 em arccos(3x)',
                text: 'A regra da cadeia multiplica por 3 e troca x^2 por (3x)^2 = 9x^2. Escrever -1/sqrt(1 - 9x^2) acerta o interior e ainda deixa de fora o fator da frente.',
            },
            {
                title: 'Usar a fórmula fora de (-1, 1)',
                text: 'arccos(2) não é real, e -1/sqrt(1 - 4) também não. O que está sob a raiz tem de ser positivo, então a entrada de arccos, inclusive qualquer função interna, tem de estar estritamente entre -1 e 1.',
            },
        ],
        relatedHeading: 'Funções relacionadas',
        related: [
            { href: '/derivative-of-arcsin-x', label: 'Derivada de arcsen(x)', note: 'A mesma raiz com o sinal oposto. A soma é a derivada de π/2, que é 0.' },
            { href: '/derivative-of-arctan-x', label: 'Derivada de arctan(x)', note: '1/(1 + x^2). Sem raiz quadrada e sem restrição a (-1, 1).' },
            { href: '/derivative-of-cos-x', label: 'Derivada de cos(x)', note: '-sen(x). Esse sinal de menos é a regra do cosseno, não esta regra inversa.' },
            { href: hub, label: 'Derivadas das funções trigonométricas', note: 'De sen a cot, e depois as três inversas, numa tabela.' },
        ],
        faqs: [
            {
                question: 'Qual é a derivada de arccos(x)?',
                answer: 'A derivada de arccos(x) é -1/sqrt(1 - x^2), para -1 < x < 1.',
            },
            {
                question: 'Qual é a derivada de cos^-1(x)?',
                answer: 'cos^-1(x) significa arccos(x). A derivada é -1/sqrt(1 - x^2), não a derivada de sec(x).',
            },
            {
                question: 'Por que a derivada de arccos é negativa?',
                answer: 'arccos diminui de π a 0 quando x vai de -1 a 1, então toda inclinação é negativa. A identidade arcsen(x) + arccos(x) = π/2 obriga as duas derivadas a serem opostas.',
            },
            {
                question: 'Como a derivada de arccos se relaciona com a de arcsen?',
                answer: 'Elas somam zero. d/dx arccos(x) = - d/dx arcsen(x) = -1/sqrt(1 - x^2).',
            },
        ],
    },
    'derivative-of-arctan-x': {
        slug: 'derivative-of-arctan-x',
        title: 'Derivada de arctan(x) (tan^-1 x)',
        description: 'A derivada de arctan(x), tan^-1(x) e atan(x) é 1/(1+x^2) para todo real. Prova, arctan(2x) e a confusão com tan.',
        formulaHeading: 'Fórmula de arctan(x), tan^-1(x) e atan(x)',
        formula: 'd/dx arctan(x) = d/dx tan^-1(x) = d/dx atan(x) = 1 / (1 + x^2), para todo x real.',
        formulaNote: 'Ao contrário de arcsen e arccos, não há raiz quadrada nem falha no domínio. A derivada é sempre positiva e tende a 0 quando x vai a qualquer um dos infinitos, como as assíntotas horizontais de arctan. A calculadora vem com atan(x).',
        calculatorFormula: 'atan(x)',
        calculatorLabel: 'Abrir arctan(x) na calculadora de derivadas',
        derivationHeading: 'De tan(y) = x a 1/(1+x^2)',
        derivation: [
            'Seja y = arctan(x), de modo que tan(y) = x e y está em (-π/2, π/2). Derivar os dois lados usa a derivada conhecida da tangente: sec^2(y) · y\' = 1.',
            'Assim y\' = 1/sec^2(y). A identidade pitagórica sec^2(y) = 1 + tan^2(y) reescreve o denominador sem função trigonométrica. Como tan(y) = x, o denominador é 1 + x^2.',
            'O resultado 1/(1 + x^2) está definido para todo real. Também é a derivada de tan^-1(x) e de atan(x); são nomes da mesma função. Não é a derivada de tan(x), que é sec^2(x) e não está definida nos múltiplos ímpares de π/2.',
        ],
        derivationSteps: [
            'Definir y = arctan(x), de modo que tan(y) = x e y está em (-π/2, π/2).',
            'Derivar os dois lados: sec^2(y) · dy/dx = 1.',
            'Isolar: dy/dx = 1/sec^2(y).',
            'Usar sec^2(y) = 1 + tan^2(y).',
            'Trocar tan(y) por x: sec^2(y) = 1 + x^2.',
            'Concluir d/dx arctan(x) = 1/(1 + x^2), para todo x real.',
        ],
        examplesHeading: 'Exemplos resolvidos, inclusive d/dx atan(2x)',
        examples: [
            {
                title: 'd/dx atan(x) em x = 1',
                steps: [
                    'atan(x) é arctan(x). A derivada é 1/(1 + x^2).',
                    'Em x = 1 o denominador é 1 + 1 = 2.',
                    'A inclinação é 1/2. Arctan(1) = π/4, e a tangente ali não é horizontal.',
                ],
                answer: '1/2',
                calculatorFormula: 'atan(x)',
            },
            {
                title: 'Derivada de arctan(2x)',
                steps: [
                    'Derivada externa: 1/(1 + u^2) com u = 2x.',
                    'Derivada interna: 2. A cadeia multiplica por 2 e eleva o 2 ao quadrado por dentro.',
                    '1 + (2x)^2 = 1 + 4x^2. Não há restrição de domínio.',
                ],
                answer: '2 / (1 + 4x^2)',
                calculatorFormula: 'atan(2*x)',
            },
            {
                title: 'Derivada de arctan(x) + arctan(1/x) para x > 0',
                steps: [
                    'Para x > 0 a soma arctan(x) + arctan(1/x) é π/2, uma constante.',
                    'Derivar confirma: 1/(1 + x^2) mais a cadeia em arctan(1/x).',
                    'O segundo termo é [1/(1 + 1/x^2)] · (-1/x^2) = -1/(1 + x^2).',
                    'Os termos se cancelam. Uma resposta diferente de zero significa que a derivada de 1/x foi esquecida.',
                ],
                answer: '0, para x > 0',
                calculatorFormula: 'atan(x)+atan(1/x)',
            },
        ],
        mistakesHeading: 'Erros que trocam arctan por tan',
        mistakes: [
            {
                title: 'Responder sec^2(x)',
                text: 'sec^2(x) é a derivada de tan(x). A derivada de arctan(x) é a função racional 1/(1 + x^2). Uma não é limitada perto de π/2; a outra nunca passa de 1.',
            },
            {
                title: 'Escrever 1/(1 - x^2)',
                text: 'O denominador é 1 mais x^2, porque a identidade é sec^2 = 1 + tan^2. Um menos no denominador é outra função (aparece em artanh, não em arctan) e não está definido em x = ±1, onde arctan está.',
            },
            {
                title: 'Regra da cadeia em arctan(2x)',
                text: 'Dois erros são comuns. Esquecer o 2 dá 1/(1 + 4x^2). Não elevar o 2 ao quadrado dá 2/(1 + 2x^2). A derivada do interior é 2, e (2x)^2 é 4x^2, então a resposta é 2/(1 + 4x^2).',
            },
            {
                title: 'Restringir o domínio a (-1, 1)',
                text: 'Essa restrição é de arcsen e arccos. Arctan aceita qualquer real, e 1 + x^2 nunca é zero, então a derivada tem o mesmo domínio da função.',
            },
        ],
        relatedHeading: 'Funções relacionadas',
        related: [
            { href: '/derivative-of-arcsin-x', label: 'Derivada de arcsen(x)', note: '1/sqrt(1 - x^2), só em (-1, 1). A busca sen^-1(x) pertence a essa página.' },
            { href: '/derivative-of-arccos-x', label: 'Derivada de arccos(x)', note: 'A raiz negativa. Arctan não forma com ela uma soma constante na reta toda.' },
            { href: '/derivative-of-tan-x', label: 'Derivada de tan(x)', note: 'sec^2(x). É a função que arctan inverte, e as derivadas não são recíprocas uma da outra.' },
            { href: hub, label: 'Derivadas das funções trigonométricas', note: 'As seis usuais e as três inversas, com as variantes da cadeia ao lado.' },
        ],
        faqs: [
            {
                question: 'Qual é a derivada de tan^-1(x)?',
                answer: 'A derivada de tan^-1(x) é 1/(1 + x^2). tan^-1(x) significa arctan(x), não 1/tan(x).',
            },
            {
                question: 'Quanto é d/dx atan(x)?',
                answer: 'atan(x) é a mesma função que arctan(x). d/dx atan(x) = 1/(1 + x^2), para todo x real.',
            },
            {
                question: 'Qual é a derivada de arctan(2x)?',
                answer: 'Pela regra da cadeia é 2/(1 + (2x)^2), que simplifica para 2/(1 + 4x^2).',
            },
            {
                question: 'A derivada de arctan(x) é sec^2(x)?',
                answer: 'Não. sec^2(x) é a derivada de tan(x). A derivada de arctan(x) é 1/(1 + x^2).',
            },
        ],
    },
};

const lessons: Record<Locale, Record<InverseTrigSlug, InverseTrigLesson>> = { en, es, pt };

export function getInverseTrigLesson(slug: string, locale: string): InverseTrigLesson | null {
    if (!isInverseTrigSlug(slug)) return null;
    return lessons[normalizeLocale(locale)][slug];
}

export function lessonPlainText(lesson: InverseTrigLesson): string {
    return [
        lesson.formula,
        lesson.formulaNote,
        ...lesson.derivation,
        ...lesson.derivationSteps,
        ...lesson.examples.flatMap((example) => [example.title, example.answer, ...example.steps]),
        ...lesson.mistakes.flatMap((mistake) => [mistake.title, mistake.text]),
        ...lesson.related.map((item) => `${item.label} ${item.note}`),
        ...lesson.faqs.flatMap((faq) => [faq.question, faq.answer]),
    ].join(' ');
}
