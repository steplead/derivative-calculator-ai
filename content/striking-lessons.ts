/**
 * Hand-written upgrades for the four derivative pages sitting in positions 11–30.
 * Each lead states the derivative in the first sentence. FAQ answers are the
 * strings rendered on the page and emitted as FAQPage JSON-LD.
 */

import type { Locale } from '@/lib/seo';
import { normalizeLocale } from '@/lib/seo';
import type { DerivativeLesson, RelatedLink } from '@/content/derivative-lesson';

export type WorkedExample = {
  heading: string;
  title: string;
  steps: string[];
  answer: string;
};

export type StrikingMeta = {
  title: string;
  h1: string;
  description: string;
  lead: string;
};

export type StrikingBody = StrikingMeta & {
  paragraphs: string[];
  steps: string[];
  example: WorkedExample;
  mistakes: { title: string; text: string }[];
  faqs: { question: string; answer: string }[];
  extraRelated: RelatedLink[];
  stepsHeading: string;
  relatedHeading: string;
};

const STRIKING: Record<string, Record<Locale, StrikingBody | StrikingMeta>> = {
  'derivative-of-tan-x': {
    en: {
      title: 'Derivative of tan(x) = sec(x)^2',
      h1: 'Derivative of tan(x) is sec(x)^2',
      description: 'The derivative of tan(x) is sec(x)^2. Quotient-rule proof from sin/cos, the slope at pi/4, and the sec-without-a-square mistake.',
      lead: 'The derivative of tan(x) is sec(x)^2 wherever cos(x) is not zero.',
      paragraphs: [
        'That is the same function as 1/cos(x)^2, and the Pythagorean identity also writes it as 1 + tan(x)^2. The three forms agree on every interval where tangent itself is defined. They are not three different derivatives.',
        'Tangent is the quotient sin(x)/cos(x). The quotient rule is what produces the square: the denominator of the rule is already cos(x)^2, and the numerator collapses to 1 because cos(x)^2 + sin(x)^2 = 1. A calculator that only prints "trigonometric rule" is skipping that algebra. The algebra is the reason the square has to be there.',
        'Cosine is zero at the odd multiples of pi/2, and tangent has a vertical asymptote at each of those points. The derivative is undefined in the same places. Between the asymptotes, sec(x)^2 is always positive, so tangent is increasing on each interval where it exists. Near x = 0 the value is about 1, which matches the slope you see on the graph.',
      ],
      stepsHeading: 'Quotient-rule derivation of sec(x)^2',
      steps: [
        'Write tan(x) as sin(x)/cos(x). Call the numerator u and the denominator v.',
        'Differentiate the pieces you already know: u\' = cos(x) and v\' = -sin(x).',
        'Apply the quotient rule (u/v)\' = (u\'v - uv\') / v^2.',
        'Substitute: numerator = cos(x)·cos(x) - sin(x)·(-sin(x)) = cos(x)^2 + sin(x)^2.',
        'Replace the numerator with 1, using cos(x)^2 + sin(x)^2 = 1. The denominator stays cos(x)^2.',
        'Conclude d/dx tan(x) = 1/cos(x)^2. By the definition of secant, that is sec(x)^2.',
        'Optional check of the other form: 1 + tan(x)^2 = 1 + sin(x)^2/cos(x)^2 = (cos(x)^2 + sin(x)^2)/cos(x)^2 = sec(x)^2.',
      ],
      example: {
        heading: 'Worked example',
        title: 'Slope of tan(x) at x = pi/4',
        steps: [
          'sec(pi/4) = 1/cos(pi/4) = 1/(√2/2) = √2.',
          'Square it: sec(pi/4)^2 = 2. The slope of the tangent line is 2, not √2.',
          'tan(pi/4) = 1, so the tangent line is y - 1 = 2(x - pi/4).',
          'A secant from pi/4 to pi/4 + 0.001 has a slope near 2. It does not approach 1, which is what you would get from sec(x) without the square.',
        ],
        answer: '2',
      },
      mistakes: [
        {
          title: 'Answering sec(x) instead of sec(x)^2',
          text: 'sec(x) is the reciprocal of cosine. The quotient rule leaves cos(x)^2 in the denominator, so the reciprocal is squared. At x = pi/4 the wrong answer √2 is about 1.41, and the true slope is 2.',
        },
        {
          title: 'Using the derivative of arctan(x)',
          text: 'The derivative of arctan(x) is 1/(1 + x^2), a function that never exceeds 1 and is defined for every real x. sec(x)^2 is unbounded and has gaps at the asymptotes of tangent. Inverting a function does not invert its derivative.',
        },
        {
          title: 'Evaluating at x = pi/2',
          text: 'tan(pi/2) is undefined, so it has no slope there. sec(pi/2)^2 is undefined for the same reason: cosine is zero. The formula is only a derivative on the open intervals between consecutive asymptotes.',
        },
      ],
      faqs: [
        {
          question: 'What is the derivative of tan(x)?',
          answer: 'The derivative of tan(x) is sec(x)^2, also written 1/cos(x)^2 or 1 + tan(x)^2, on every interval where cos(x) is not zero.',
        },
        {
          question: 'Why is the derivative of tan(x) equal to sec(x)^2?',
          answer: 'tan(x) = sin(x)/cos(x). The quotient rule gives (cos(x)^2 + sin(x)^2)/cos(x)^2. The numerator is 1, and 1/cos(x)^2 is sec(x)^2.',
        },
        {
          question: 'Is the derivative of tan(x) defined at pi/2?',
          answer: 'No. tan(x) has a vertical asymptote at pi/2, and at every odd multiple of pi/2. The derivative does not exist at those points.',
        },
        {
          question: 'What is the slope of tan(x) at pi/4?',
          answer: 'sec(pi/4)^2 = 2. The tangent line at that point has slope 2 and passes through (pi/4, 1).',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-sin-x', label: 'Derivative of sin(x)', note: 'cos(x). The quotient proof above starts from this and from the derivative of cos(x).' },
        { href: '/derivative-of-arctan-x', label: 'Derivative of arctan(x)', note: '1/(1 + x^2). The inverse tangent, not this derivative read backwards.' },
        { href: '/derivative-of-sec-x', label: 'Derivative of sec(x)', note: 'sec(x) tan(x). Built from the same cosine denominator, with a different numerator.' },
      ],
      relatedHeading: 'Related derivatives',
    },
    es: {
      title: 'Derivada de tan(x) = sec(x)^2',
      h1: 'La derivada de tan(x) es sec(x)^2',
      description: 'La derivada de tan(x) es sec(x)^2. Demostración con la regla del cociente, pendiente en pi/4 y el error de olvidar el cuadrado.',
      lead: 'La derivada de tan(x) es sec(x)^2 en todo intervalo donde cos(x) no es cero.',
      paragraphs: [
        'Es la misma función que 1/cos(x)^2, y la identidad pitagórica también la escribe como 1 + tan(x)^2. Las tres formas coinciden donde la tangente está definida. No son tres derivadas distintas.',
        'La tangente es el cociente sin(x)/cos(x). La regla del cociente produce el cuadrado: el denominador de la regla ya es cos(x)^2, y el numerador se reduce a 1 porque cos(x)^2 + sin(x)^2 = 1. Un resultado que solo dice "regla trigonométrica" se salta ese álgebra, y el álgebra es la razón del cuadrado.',
        'El coseno se anula en los múltiplos impares de pi/2, y ahí la tangente tiene una asíntota vertical. La derivada no existe en esos puntos. Entre asíntotas, sec(x)^2 es positiva, así que la tangente crece en cada intervalo donde existe. Cerca de x = 0 vale cerca de 1, como la pendiente de la gráfica.',
      ],
      stepsHeading: 'Derivación con la regla del cociente',
      steps: [
        'Escribe tan(x) como sin(x)/cos(x). El numerador es u y el denominador es v.',
        'Deriva las piezas conocidas: u\' = cos(x) y v\' = -sin(x).',
        'Aplica (u/v)\' = (u\'v - uv\') / v^2.',
        'Sustituye: numerador = cos(x)·cos(x) - sin(x)·(-sin(x)) = cos(x)^2 + sin(x)^2.',
        'El numerador es 1. El denominador sigue siendo cos(x)^2.',
        'Concluye d/dx tan(x) = 1/cos(x)^2, que es sec(x)^2.',
        'Chequeo: 1 + tan(x)^2 = (cos(x)^2 + sin(x)^2)/cos(x)^2 = sec(x)^2.',
      ],
      example: {
        heading: 'Ejemplo resuelto',
        title: 'Pendiente de tan(x) en x = pi/4',
        steps: [
          'sec(pi/4) = √2.',
          'Al cuadrado: sec(pi/4)^2 = 2. La pendiente es 2, no √2.',
          'tan(pi/4) = 1, así que la recta tangente es y - 1 = 2(x - pi/4).',
          'Una secante de pi/4 a pi/4 + 0,001 tiene pendiente cerca de 2. No se acerca a 1.',
        ],
        answer: '2',
      },
      mistakes: [
        {
          title: 'Responder sec(x) sin el cuadrado',
          text: 'sec(x) es el recíproco del coseno. La regla del cociente deja cos(x)^2 en el denominador, así que el recíproco va al cuadrado. En pi/4 la respuesta √2 vale cerca de 1,41 y la pendiente real es 2.',
        },
        {
          title: 'Usar la derivada de arctan(x)',
          text: 'La derivada de arctan(x) es 1/(1 + x^2). Nunca pasa de 1 y está definida en todo real. sec(x)^2 no está acotada y tiene huecos en las asíntotas. Invertir la función no invierte la derivada.',
        },
        {
          title: 'Evaluar en x = pi/2',
          text: 'tan(pi/2) no está definida, así que no tiene pendiente. sec(pi/2)^2 tampoco existe, porque el coseno es cero. La fórmula solo es una derivada entre asíntotas consecutivas.',
        },
      ],
      faqs: [
        {
          question: '¿Cuál es la derivada de tan(x)?',
          answer: 'La derivada de tan(x) es sec(x)^2, también escrita 1/cos(x)^2 o 1 + tan(x)^2, en cada intervalo donde cos(x) no es cero.',
        },
        {
          question: '¿Por qué la derivada de tan(x) es sec(x)^2?',
          answer: 'tan(x) = sin(x)/cos(x). La regla del cociente da (cos(x)^2 + sin(x)^2)/cos(x)^2. El numerador es 1, y 1/cos(x)^2 es sec(x)^2.',
        },
        {
          question: '¿La derivada de tan(x) existe en pi/2?',
          answer: 'No. tan(x) tiene una asíntota vertical en pi/2 y en cada múltiplo impar de pi/2. Ahí la derivada no existe.',
        },
        {
          question: '¿Cuál es la pendiente de tan(x) en pi/4?',
          answer: 'sec(pi/4)^2 = 2. La recta tangente en ese punto tiene pendiente 2 y pasa por (pi/4, 1).',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-sin-x', label: 'Derivada de sen(x)', note: 'cos(x). La demostración del cociente empieza por esta derivada y por la del coseno.' },
        { href: '/derivative-of-arctan-x', label: 'Derivada de arctan(x)', note: '1/(1 + x^2). Es la tangente inversa, no esta derivada leída al revés.' },
        { href: '/derivative-of-sec-x', label: 'Derivada de sec(x)', note: 'sec(x) tan(x). Sale del mismo denominador coseno, con otro numerador.' },
      ],
      relatedHeading: 'Derivadas relacionadas',
    },
    pt: {
      title: 'Derivada de tan(x) = sec(x)^2',
      h1: 'A derivada de tan(x) é sec(x)^2',
      description: 'A derivada de tan(x) é sec(x)^2. Prova pela regra do quociente, inclinação em pi/4 e o erro de esquecer o quadrado.',
      lead: 'A derivada de tan(x) é sec(x)^2 em todo intervalo em que cos(x) não é zero.',
      paragraphs: [
        'É a mesma função que 1/cos(x)^2, e a identidade pitagórica também a escreve como 1 + tan(x)^2. As três formas coincidem onde a tangente está definida. Não são três derivadas diferentes.',
        'A tangente é o quociente sin(x)/cos(x). A regra do quociente produz o quadrado: o denominador da regra já é cos(x)^2, e o numerador vira 1 porque cos(x)^2 + sin(x)^2 = 1. Um resultado que só diz "regra trigonométrica" pula essa álgebra, e a álgebra é o motivo do quadrado.',
        'O cosseno se anula nos múltiplos ímpares de pi/2, e a tangente tem assíntota vertical em cada um desses pontos. A derivada não existe ali. Entre as assíntotas, sec(x)^2 é positiva, então a tangente cresce em cada intervalo em que existe. Perto de x = 0 o valor fica perto de 1, como a inclinação do gráfico.',
      ],
      stepsHeading: 'Derivação pela regra do quociente',
      steps: [
        'Escreva tan(x) como sin(x)/cos(x). O numerador é u e o denominador é v.',
        'Derive as peças conhecidas: u\' = cos(x) e v\' = -sin(x).',
        'Aplique (u/v)\' = (u\'v - uv\') / v^2.',
        'Substitua: numerador = cos(x)·cos(x) - sin(x)·(-sin(x)) = cos(x)^2 + sin(x)^2.',
        'O numerador é 1. O denominador continua cos(x)^2.',
        'Conclua d/dx tan(x) = 1/cos(x)^2, que é sec(x)^2.',
        'Checagem: 1 + tan(x)^2 = (cos(x)^2 + sin(x)^2)/cos(x)^2 = sec(x)^2.',
      ],
      example: {
        heading: 'Exemplo resolvido',
        title: 'Inclinação de tan(x) em x = pi/4',
        steps: [
          'sec(pi/4) = √2.',
          'Ao quadrado: sec(pi/4)^2 = 2. A inclinação é 2, não √2.',
          'tan(pi/4) = 1, então a reta tangente é y - 1 = 2(x - pi/4).',
          'Uma secante de pi/4 até pi/4 + 0,001 tem inclinação perto de 2. Não se aproxima de 1.',
        ],
        answer: '2',
      },
      mistakes: [
        {
          title: 'Responder sec(x) sem o quadrado',
          text: 'sec(x) é o recíproco do cosseno. A regra do quociente deixa cos(x)^2 no denominador, então o recíproco fica ao quadrado. Em pi/4 a resposta √2 vale cerca de 1,41 e a inclinação verdadeira é 2.',
        },
        {
          title: 'Usar a derivada de arctan(x)',
          text: 'A derivada de arctan(x) é 1/(1 + x^2). Nunca passa de 1 e está definida em todo real. sec(x)^2 não é limitada e tem falhas nas assíntotas. Inverter a função não inverte a derivada.',
        },
        {
          title: 'Calcular em x = pi/2',
          text: 'tan(pi/2) não está definida, então não tem inclinação. sec(pi/2)^2 também não existe, porque o cosseno é zero. A fórmula só é uma derivada entre assíntotas consecutivas.',
        },
      ],
      faqs: [
        {
          question: 'Qual é a derivada de tan(x)?',
          answer: 'A derivada de tan(x) é sec(x)^2, também escrita 1/cos(x)^2 ou 1 + tan(x)^2, em cada intervalo em que cos(x) não é zero.',
        },
        {
          question: 'Por que a derivada de tan(x) é sec(x)^2?',
          answer: 'tan(x) = sin(x)/cos(x). A regra do quociente dá (cos(x)^2 + sin(x)^2)/cos(x)^2. O numerador é 1, e 1/cos(x)^2 é sec(x)^2.',
        },
        {
          question: 'A derivada de tan(x) existe em pi/2?',
          answer: 'Não. tan(x) tem assíntota vertical em pi/2 e em cada múltiplo ímpar de pi/2. Ali a derivada não existe.',
        },
        {
          question: 'Qual é a inclinação de tan(x) em pi/4?',
          answer: 'sec(pi/4)^2 = 2. A reta tangente nesse ponto tem inclinação 2 e passa por (pi/4, 1).',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-sin-x', label: 'Derivada de sen(x)', note: 'cos(x). A prova do quociente começa por esta derivada e pela do cosseno.' },
        { href: '/derivative-of-arctan-x', label: 'Derivada de arctan(x)', note: '1/(1 + x^2). É a tangente inversa, não esta derivada lida ao contrário.' },
        { href: '/derivative-of-sec-x', label: 'Derivada de sec(x)', note: 'sec(x) tan(x). Sai do mesmo denominador cosseno, com outro numerador.' },
      ],
      relatedHeading: 'Derivadas relacionadas',
    },
  },
  'derivative-of-1-over-x-squared': {
    en: {
      title: 'Derivative of 1/x^2 = -2/x^3',
      h1: 'Derivative of 1/x^2 is -2/x^3',
      description: 'The derivative of 1/x^2 is -2/x^3. Power-rule steps, the matching quotient-rule check, and the two sign mistakes.',
      lead: 'The derivative of 1/x^2 is -2/x^3 for every real x except zero.',
      paragraphs: [
        'Rewrite the reciprocal as a power before differentiating. 1/x^2 is x^(-2). The power rule multiplies by the old exponent and then subtracts 1, so -2 comes down and the exponent becomes -3. The 2 in the answer is that old exponent. It is not a chain-rule factor, and it is not optional.',
        'The quotient rule on 1/x^2 reaches the same fraction. With numerator 1 and denominator x^2, the numerator of the derivative is 0·x^2 - 1·2x = -2x, and dividing by (x^2)^2 = x^4 cancels one x and leaves -2/x^3. If the power-rule answer and the quotient-rule answer disagree, a minus sign was dropped on one of the paths.',
        'The original function is not defined at x = 0, and neither is the derivative: a negative power blows up there. For positive x the graph falls as x grows, so the slope is negative. For negative x, x^3 is negative, so -2/x^3 is positive and the left branch is rising toward the asymptote.',
      ],
      stepsHeading: 'Power rule, then the quotient-rule check',
      steps: [
        'Rewrite 1/x^2 as x^(-2). The exponent is -2, not 2.',
        'Apply the power rule d/dx x^n = n x^(n-1) with n = -2.',
        'Multiply by the exponent: -2 · x^(-2-1) = -2 x^(-3).',
        'Write the negative power as a fraction: -2 x^(-3) = -2/x^3.',
        'Check with the quotient rule. Let u = 1 and v = x^2, so u\' = 0 and v\' = 2x.',
        'Numerator u\'v - uv\' = 0 - 2x = -2x. Denominator v^2 = x^4.',
        'Simplify -2x/x^4 = -2/x^3. Both rules agree, for x ≠ 0.',
      ],
      example: {
        heading: 'Worked example',
        title: 'Slope of 1/x^2 at x = 2',
        steps: [
          'The function value is 1/2^2 = 1/4.',
          'The derivative formula gives -2/2^3 = -2/8 = -1/4.',
          'A secant from 2 to 2.001: 1/(2.001)^2 is about 0.24975, and (0.24975 - 0.25)/0.001 is about -0.25.',
          'The wrong answer -1/x^3 would give -1/8 at this point. The missing 2 is visible in the secant.',
        ],
        answer: '-1/4',
      },
      mistakes: [
        {
          title: 'Dropping the 2 and answering -1/x^3',
          text: 'The exponent on 1/x^2 is -2, so the coefficient in front of the derivative is -2. -1/x^3 is the derivative of 1/x, moved to the wrong power. At x = 2 it is half the true slope.',
        },
        {
          title: 'Dropping the minus sign',
          text: '2/x^3 is positive for positive x, but 1/x^2 is decreasing there. A positive derivative describes a reciprocal that climbs, and this one does not. The minus sign comes from the negative exponent.',
        },
        {
          title: 'Confusing 1/x^2 with 1/x',
          text: 'The derivative of 1/x is -1/x^2. That expression is the function on this page, not the answer. Differentiating again is what produces -2/x^3.',
        },
      ],
      faqs: [
        {
          question: 'What is the derivative of 1/x^2?',
          answer: 'The derivative of 1/x^2 is -2/x^3, for every real x except zero.',
        },
        {
          question: 'How do you differentiate 1/x^2 with the power rule?',
          answer: 'Rewrite 1/x^2 as x^(-2). Multiply by -2 and reduce the exponent by 1. The result is -2 x^(-3), which is -2/x^3.',
        },
        {
          question: 'Does the quotient rule give the same derivative of 1/x^2?',
          answer: 'Yes. (0·x^2 - 1·2x)/x^4 simplifies to -2/x^3. The power rule and the quotient rule have to match.',
        },
        {
          question: 'What is the derivative of 1/x^2 at x = 2?',
          answer: 'Substitute x = 2 into -2/x^3. The slope is -2/8, which is -1/4.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-1-over-x', label: 'Derivative of 1/x', note: '-1/x^2. One step earlier: differentiate that result and you land on this page.' },
        { href: '/derivative-of-sqrt-x', label: 'Derivative of sqrt(x)', note: '1/(2 sqrt(x)). Another power-rule rewrite, this time with exponent 1/2.' },
        { href: '/wiki/power-rule', label: 'Power rule', note: 'The rule that turns x^(-2) into -2 x^(-3).' },
      ],
      relatedHeading: 'Related derivatives',
    },
    es: {
      title: 'Derivada de 1/x^2 = -2/x^3',
      h1: 'La derivada de 1/x^2 es -2/x^3',
      description: 'La derivada de 1/x^2 es -2/x^3. Pasos con la regla de la potencia, el chequeo del cociente y los dos errores de signo.',
      lead: 'La derivada de 1/x^2 es -2/x^3 para todo x real distinto de cero.',
      paragraphs: [
        'Reescribe la recíproca como potencia antes de derivar. 1/x^2 es x^(-2). La regla de la potencia multiplica por el exponente viejo y luego resta 1, así que baja el -2 y el exponente pasa a -3. El 2 de la respuesta es ese exponente. No es un factor de la cadena y no se puede omitir.',
        'La regla del cociente en 1/x^2 llega a la misma fracción. Con numerador 1 y denominador x^2, el numerador de la derivada es 0·x^2 - 1·2x = -2x, y al dividir entre (x^2)^2 = x^4 se cancela una x y queda -2/x^3. Si las dos reglas no coinciden, se perdió un signo en uno de los caminos.',
        'La función original no está definida en x = 0, y la derivada tampoco: una potencia negativa se dispara ahí. Para x positivo la gráfica baja cuando x crece, así que la pendiente es negativa. Para x negativo, x^3 es negativo, así que -2/x^3 es positiva y la rama izquierda sube hacia la asíntota.',
      ],
      stepsHeading: 'Regla de la potencia y chequeo del cociente',
      steps: [
        'Reescribe 1/x^2 como x^(-2). El exponente es -2, no 2.',
        'Aplica d/dx x^n = n x^(n-1) con n = -2.',
        'Multiplica por el exponente: -2 · x^(-3) = -2 x^(-3).',
        'Escribe la potencia negativa como fracción: -2/x^3.',
        'Chequeo con el cociente. u = 1, v = x^2, u\' = 0, v\' = 2x.',
        'Numerador = -2x. Denominador = x^4.',
        'Simplifica -2x/x^4 = -2/x^3. Las dos reglas coinciden si x ≠ 0.',
      ],
      example: {
        heading: 'Ejemplo resuelto',
        title: 'Pendiente de 1/x^2 en x = 2',
        steps: [
          'El valor de la función es 1/4.',
          'La fórmula da -2/8 = -1/4.',
          'Una secante de 2 a 2,001 cae cerca de -0,25.',
          'La respuesta incompleta -1/x^3 daría -1/8. El 2 que falta se ve en la secante.',
        ],
        answer: '-1/4',
      },
      mistakes: [
        {
          title: 'Perder el 2 y responder -1/x^3',
          text: 'El exponente de 1/x^2 es -2, así que el coeficiente es -2. -1/x^3 es la derivada de 1/x, puesta en la potencia equivocada. En x = 2 es la mitad de la pendiente real.',
        },
        {
          title: 'Perder el signo menos',
          text: '2/x^3 es positiva para x positivo, pero 1/x^2 ahí decrece. Una derivada positiva describe una recíproca que sube, y esta no sube. El menos sale del exponente negativo.',
        },
        {
          title: 'Confundir 1/x^2 con 1/x',
          text: 'La derivada de 1/x es -1/x^2. Esa expresión es la función de esta página, no la respuesta. Derivar otra vez es lo que produce -2/x^3.',
        },
      ],
      faqs: [
        {
          question: '¿Cuál es la derivada de 1/x^2?',
          answer: 'La derivada de 1/x^2 es -2/x^3, para todo x real excepto cero.',
        },
        {
          question: '¿Cómo se deriva 1/x^2 con la regla de la potencia?',
          answer: 'Escribe 1/x^2 como x^(-2). Multiplica por -2 y baja el exponente en 1. El resultado es -2 x^(-3), o sea -2/x^3.',
        },
        {
          question: '¿La regla del cociente da la misma derivada de 1/x^2?',
          answer: 'Sí. (0·x^2 - 1·2x)/x^4 se simplifica a -2/x^3. La regla de la potencia y la del cociente tienen que coincidir.',
        },
        {
          question: '¿Cuál es la derivada de 1/x^2 en x = 2?',
          answer: 'Sustituye x = 2 en -2/x^3. La pendiente es -2/8, que es -1/4.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-1-over-x', label: 'Derivada de 1/x', note: '-1/x^2. Un paso antes: deriva ese resultado y llegas a esta página.' },
        { href: '/derivative-of-sqrt-x', label: 'Derivada de sqrt(x)', note: '1/(2 sqrt(x)). Otra reescritura de potencia, ahora con exponente 1/2.' },
        { href: '/wiki/power-rule', label: 'Regla de la potencia', note: 'La regla que convierte x^(-2) en -2 x^(-3).' },
      ],
      relatedHeading: 'Derivadas relacionadas',
    },
    pt: {
      title: 'Derivada de 1/x^2 = -2/x^3',
      h1: 'A derivada de 1/x^2 é -2/x^3',
      description: 'A derivada de 1/x^2 é -2/x^3. Passos pela regra da potência, a checagem do quociente e os dois erros de sinal.',
      lead: 'A derivada de 1/x^2 é -2/x^3 para todo x real exceto zero.',
      paragraphs: [
        'Reescreva o recíproco como potência antes de derivar. 1/x^2 é x^(-2). A regra da potência multiplica pelo expoente antigo e depois subtrai 1, então o -2 desce e o expoente vira -3. O 2 da resposta é esse expoente. Não é fator da cadeia e não é opcional.',
        'A regra do quociente em 1/x^2 chega à mesma fração. Com numerador 1 e denominador x^2, o numerador da derivada é 0·x^2 - 1·2x = -2x, e dividir por (x^2)^2 = x^4 cancela um x e deixa -2/x^3. Se as duas regras discordam, um sinal foi perdido num dos caminhos.',
        'A função original não está definida em x = 0, e a derivada também não: uma potência negativa explode ali. Para x positivo o gráfico desce quando x cresce, então a inclinação é negativa. Para x negativo, x^3 é negativo, então -2/x^3 é positiva e o ramo esquerdo sobe em direção à assíntota.',
      ],
      stepsHeading: 'Regra da potência e checagem do quociente',
      steps: [
        'Reescreva 1/x^2 como x^(-2). O expoente é -2, não 2.',
        'Aplique d/dx x^n = n x^(n-1) com n = -2.',
        'Multiplique pelo expoente: -2 · x^(-3) = -2 x^(-3).',
        'Escreva a potência negativa como fração: -2/x^3.',
        'Checagem com o quociente. u = 1, v = x^2, u\' = 0, v\' = 2x.',
        'Numerador = -2x. Denominador = x^4.',
        'Simplifique -2x/x^4 = -2/x^3. As duas regras concordam se x ≠ 0.',
      ],
      example: {
        heading: 'Exemplo resolvido',
        title: 'Inclinação de 1/x^2 em x = 2',
        steps: [
          'O valor da função é 1/4.',
          'A fórmula dá -2/8 = -1/4.',
          'Uma secante de 2 até 2,001 cai perto de -0,25.',
          'A resposta incompleta -1/x^3 daria -1/8. O 2 que falta aparece na secante.',
        ],
        answer: '-1/4',
      },
      mistakes: [
        {
          title: 'Perder o 2 e responder -1/x^3',
          text: 'O expoente de 1/x^2 é -2, então o coeficiente é -2. -1/x^3 é a derivada de 1/x, colocada na potência errada. Em x = 2 ela é a metade da inclinação verdadeira.',
        },
        {
          title: 'Perder o sinal de menos',
          text: '2/x^3 é positiva para x positivo, mas 1/x^2 decresce ali. Uma derivada positiva descreve um recíproco que sobe, e este não sobe. O menos vem do expoente negativo.',
        },
        {
          title: 'Confundir 1/x^2 com 1/x',
          text: 'A derivada de 1/x é -1/x^2. Essa expressão é a função desta página, não a resposta. Derivar de novo é o que produz -2/x^3.',
        },
      ],
      faqs: [
        {
          question: 'Qual é a derivada de 1/x^2?',
          answer: 'A derivada de 1/x^2 é -2/x^3, para todo x real exceto zero.',
        },
        {
          question: 'Como derivar 1/x^2 com a regra da potência?',
          answer: 'Escreva 1/x^2 como x^(-2). Multiplique por -2 e diminua o expoente em 1. O resultado é -2 x^(-3), isto é -2/x^3.',
        },
        {
          question: 'A regra do quociente dá a mesma derivada de 1/x^2?',
          answer: 'Sim. (0·x^2 - 1·2x)/x^4 simplifica para -2/x^3. A regra da potência e a do quociente têm de concordar.',
        },
        {
          question: 'Qual é a derivada de 1/x^2 em x = 2?',
          answer: 'Substitua x = 2 em -2/x^3. A inclinação é -2/8, que é -1/4.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-1-over-x', label: 'Derivada de 1/x', note: '-1/x^2. Um passo antes: derive esse resultado e você chega nesta página.' },
        { href: '/derivative-of-sqrt-x', label: 'Derivada de sqrt(x)', note: '1/(2 sqrt(x)). Outra reescrita de potência, agora com expoente 1/2.' },
        { href: '/wiki/power-rule', label: 'Regra da potência', note: 'A regra que transforma x^(-2) em -2 x^(-3).' },
      ],
      relatedHeading: 'Derivadas relacionadas',
    },
  },
  'derivative-of-pi': {
    en: {
      title: 'Derivative of pi is 0',
      h1: 'Derivative of pi is 0',
      description: 'The derivative of pi is 0. Pi is a constant near 3.14159, so the difference quotient is zero. A worked x^2 + pi example.',
      lead: 'The derivative of pi is 0.',
      paragraphs: [
        'Pi is a number, about 3.14159, even though it is written as a Greek letter. A letter is a variable only when it changes with x. In d/dx, pi does not. The constant rule says the derivative of any constant is 0, and the difference quotient shows why: (pi - pi)/h = 0 for every step h, so the limit is 0 before you take it.',
        'The same rule covers 5, e, and any numeral standing alone. It does not cover a product or a composition in which pi multiplies a function of x. The derivative of pi·x is pi, because the constant factor stays and the derivative of x is 1. The derivative of sin(pi·x) is pi·cos(pi·x): the chain rule brings down the derivative of the inside, which is pi, and that factor is not zero.',
        'People mix this up with "pi is important, so its rate of change should be interesting." Importance is not dependence on x. The graph of y = pi is a horizontal line. Every tangent line is the line itself, and the slope of a horizontal line is 0.',
      ],
      stepsHeading: 'From the definition to the constant rule',
      steps: [
        'Set f(x) = pi. The output is the same number at every x.',
        'Form the difference quotient: (f(x+h) - f(x))/h = (pi - pi)/h = 0.',
        'The quotient is already 0 for every h ≠ 0. Its limit as h approaches 0 is 0.',
        'Name the rule you just proved: the derivative of a constant is 0.',
        'Contrast d/dx (pi·x). The constant multiple rule keeps pi and differentiates x, so the derivative is pi.',
        'Contrast d/dx sin(pi·x). The chain rule multiplies cos(pi·x) by the inner derivative pi.',
      ],
      example: {
        heading: 'Worked example',
        title: 'Derivative of x^2 + pi',
        steps: [
          'Differentiate term by term. The derivative of x^2 is 2x.',
          'The derivative of pi is 0, so the constant term disappears.',
          'The sum is 2x + 0 = 2x.',
          'At x = 3 the slope is 6, the same slope x^2 would have had without the pi. Adding a constant shifts the graph up and does not tilt it.',
        ],
        answer: '2x',
      },
      mistakes: [
        {
          title: 'Answering 1',
          text: 'The derivative of x is 1. Pi is not x. Answering 1 treats a fixed number as the input variable. The difference quotient for pi is 0/h, which is 0, not 1.',
        },
        {
          title: 'Answering pi',
          text: 'Pi is the value of the function, not its slope. The derivative of pi·x is pi. The derivative of pi alone is 0. Reading "of pi" as "pi stays in the answer" skips the question of whether pi depends on x.',
        },
        {
          title: 'Cancelling pi inside sin(pi·x)',
          text: 'The derivative of sin(pi·x) is not cos(pi·x). The inside still depends on x, and its derivative is pi. A constant in front of x survives the chain rule. A constant with no x beside it does not.',
        },
      ],
      faqs: [
        {
          question: 'What is the derivative of pi?',
          answer: 'The derivative of pi is 0. Pi does not depend on x, so it is a constant.',
        },
        {
          question: 'Why is the derivative of a constant equal to 0?',
          answer: 'If f(x) = c for every x, then (f(x+h) - f(x))/h = 0. The limit is 0. Pi, 5, and e are constants of that kind.',
        },
        {
          question: 'What is the derivative of pi times x?',
          answer: 'The derivative of pi·x is pi. The constant factor stays, and the derivative of x is 1.',
        },
        {
          question: 'Is the derivative of pi the same as the derivative of e?',
          answer: 'Yes, both are 0, because both are constants. The derivative of e^x is e^x, because the exponent depends on x. The derivative of pi^x is pi^x ln(pi), for the same reason.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-x-squared', label: 'Derivative of x^2', note: '2x. Add pi and the extra term still contributes nothing.' },
        { href: '/derivative-of-e-to-the-x', label: 'Derivative of e^x', note: 'e^x. The base is constant, but the exponent is x, so the derivative is not 0.' },
        { href: '/wiki/power-rule', label: 'Power rule', note: 'Includes the constant rule as the case where the power of x is zero.' },
      ],
      relatedHeading: 'Related derivatives',
    },
    es: {
      title: 'La derivada de pi es 0',
      h1: 'La derivada de pi es 0',
      description: 'La derivada de pi es 0. Pi es una constante cercana a 3,14159, así que el cociente incremental vale cero. Ejemplo con x^2 + pi.',
      lead: 'La derivada de pi es 0.',
      paragraphs: [
        'Pi es un número, cerca de 3,14159, aunque se escriba con una letra griega. Una letra es variable solo si cambia con x. En d/dx, pi no cambia. La regla de la constante dice que la derivada de cualquier constante es 0, y el cociente lo muestra: (pi - pi)/h = 0 para cualquier paso h, así que el límite ya es 0.',
        'La misma regla cubre 5, e y cualquier numeral solo. No cubre un producto o una composición en la que pi multiplica una función de x. La derivada de pi·x es pi, porque el factor constante se queda y la derivada de x es 1. La derivada de sin(pi·x) es pi·cos(pi·x): la regla de la cadena baja la derivada del interior, que es pi, y ese factor no es cero.',
        'A veces se confunde "pi es importante" con "su tasa de cambio debe ser interesante". La importancia no es dependencia de x. La gráfica de y = pi es una recta horizontal. Cada recta tangente es la misma recta, y la pendiente de una horizontal es 0.',
      ],
      stepsHeading: 'De la definición a la regla de la constante',
      steps: [
        'Pon f(x) = pi. La salida es el mismo número en cada x.',
        'Forma el cociente: (f(x+h) - f(x))/h = (pi - pi)/h = 0.',
        'El cociente ya es 0 para todo h ≠ 0. Su límite cuando h tiende a 0 es 0.',
        'Nombra la regla: la derivada de una constante es 0.',
        'Contraste: d/dx (pi·x) = pi, porque el factor se conserva y la derivada de x es 1.',
        'Contraste: d/dx sin(pi·x) = pi·cos(pi·x). La cadena multiplica por la derivada del interior.',
      ],
      example: {
        heading: 'Ejemplo resuelto',
        title: 'Derivada de x^2 + pi',
        steps: [
          'Deriva término a término. La derivada de x^2 es 2x.',
          'La derivada de pi es 0, así que el término constante desaparece.',
          'La suma es 2x.',
          'En x = 3 la pendiente es 6, la misma que tendría x^2 sin el pi. Sumar una constante sube la gráfica y no la inclina.',
        ],
        answer: '2x',
      },
      mistakes: [
        {
          title: 'Responder 1',
          text: 'La derivada de x es 1. Pi no es x. Responder 1 trata un número fijo como la variable. El cociente de pi es 0/h, que es 0, no 1.',
        },
        {
          title: 'Responder pi',
          text: 'Pi es el valor de la función, no su pendiente. La derivada de pi·x es pi. La derivada de pi solo es 0. Leer "de pi" como "pi se queda en la respuesta" olvida preguntar si pi depende de x.',
        },
        {
          title: 'Cancelar pi dentro de sin(pi·x)',
          text: 'La derivada de sin(pi·x) no es cos(pi·x). El interior todavía depende de x, y su derivada es pi. Una constante delante de x sobrevive a la cadena. Una constante sin x al lado no sobrevive.',
        },
      ],
      faqs: [
        {
          question: '¿Cuál es la derivada de pi?',
          answer: 'La derivada de pi es 0. Pi no depende de x, así que es una constante.',
        },
        {
          question: '¿Por qué la derivada de una constante es 0?',
          answer: 'Si f(x) = c para todo x, entonces (f(x+h) - f(x))/h = 0. El límite es 0. Pi, 5 y e son constantes de ese tipo.',
        },
        {
          question: '¿Cuál es la derivada de pi por x?',
          answer: 'La derivada de pi·x es pi. El factor constante se queda, y la derivada de x es 1.',
        },
        {
          question: '¿La derivada de pi es la misma que la de e?',
          answer: 'Sí, las dos son 0, porque las dos son constantes. La derivada de e^x es e^x, porque el exponente depende de x. La derivada de pi^x es pi^x ln(pi), por la misma razón.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-x-squared', label: 'Derivada de x^2', note: '2x. Suma pi y el término extra sigue sin aportar nada.' },
        { href: '/derivative-of-e-to-the-x', label: 'Derivada de e^x', note: 'e^x. La base es constante, pero el exponente es x, así que la derivada no es 0.' },
        { href: '/wiki/power-rule', label: 'Regla de la potencia', note: 'Incluye la regla de la constante como el caso en que la potencia de x es cero.' },
      ],
      relatedHeading: 'Derivadas relacionadas',
    },
    pt: {
      title: 'A derivada de pi é 0',
      h1: 'A derivada de pi é 0',
      description: 'A derivada de pi é 0. Pi é uma constante perto de 3,14159, então o quociente das diferenças é zero. Exemplo com x^2 + pi.',
      lead: 'A derivada de pi é 0.',
      paragraphs: [
        'Pi é um número, cerca de 3,14159, embora se escreva com uma letra grega. Uma letra é variável só se muda com x. Em d/dx, pi não muda. A regra da constante diz que a derivada de qualquer constante é 0, e o quociente mostra por quê: (pi - pi)/h = 0 para qualquer passo h, então o limite já é 0.',
        'A mesma regra cobre 5, e e qualquer numeral sozinho. Não cobre um produto ou uma composição em que pi multiplica uma função de x. A derivada de pi·x é pi, porque o fator constante fica e a derivada de x é 1. A derivada de sin(pi·x) é pi·cos(pi·x): a regra da cadeia traz a derivada do interior, que é pi, e esse fator não é zero.',
        'Às vezes se confunde "pi é importante" com "a taxa de variação deveria ser interessante". Importância não é dependência de x. O gráfico de y = pi é uma reta horizontal. Cada reta tangente é a própria reta, e a inclinação de uma horizontal é 0.',
      ],
      stepsHeading: 'Da definição à regra da constante',
      steps: [
        'Defina f(x) = pi. A saída é o mesmo número em cada x.',
        'Monte o quociente: (f(x+h) - f(x))/h = (pi - pi)/h = 0.',
        'O quociente já é 0 para todo h ≠ 0. O limite quando h tende a 0 é 0.',
        'Dê nome à regra: a derivada de uma constante é 0.',
        'Contraste: d/dx (pi·x) = pi, porque o fator fica e a derivada de x é 1.',
        'Contraste: d/dx sin(pi·x) = pi·cos(pi·x). A cadeia multiplica pela derivada do interior.',
      ],
      example: {
        heading: 'Exemplo resolvido',
        title: 'Derivada de x^2 + pi',
        steps: [
          'Derive termo a termo. A derivada de x^2 é 2x.',
          'A derivada de pi é 0, então o termo constante some.',
          'A soma é 2x.',
          'Em x = 3 a inclinação é 6, a mesma que x^2 teria sem o pi. Somar uma constante sobe o gráfico e não o inclina.',
        ],
        answer: '2x',
      },
      mistakes: [
        {
          title: 'Responder 1',
          text: 'A derivada de x é 1. Pi não é x. Responder 1 trata um número fixo como a variável. O quociente de pi é 0/h, que é 0, não 1.',
        },
        {
          title: 'Responder pi',
          text: 'Pi é o valor da função, não a inclinação. A derivada de pi·x é pi. A derivada de pi sozinho é 0. Ler "de pi" como "pi fica na resposta" esquece de perguntar se pi depende de x.',
        },
        {
          title: 'Cancelar pi dentro de sin(pi·x)',
          text: 'A derivada de sin(pi·x) não é cos(pi·x). O interior ainda depende de x, e a derivada dele é pi. Uma constante na frente de x sobrevive à cadeia. Uma constante sem x ao lado não sobrevive.',
        },
      ],
      faqs: [
        {
          question: 'Qual é a derivada de pi?',
          answer: 'A derivada de pi é 0. Pi não depende de x, então é uma constante.',
        },
        {
          question: 'Por que a derivada de uma constante é 0?',
          answer: 'Se f(x) = c para todo x, então (f(x+h) - f(x))/h = 0. O limite é 0. Pi, 5 e e são constantes desse tipo.',
        },
        {
          question: 'Qual é a derivada de pi vezes x?',
          answer: 'A derivada de pi·x é pi. O fator constante fica, e a derivada de x é 1.',
        },
        {
          question: 'A derivada de pi é a mesma que a de e?',
          answer: 'Sim, as duas são 0, porque as duas são constantes. A derivada de e^x é e^x, porque o expoente depende de x. A derivada de pi^x é pi^x ln(pi), pelo mesmo motivo.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-x-squared', label: 'Derivada de x^2', note: '2x. Some pi e o termo extra continua sem contribuir.' },
        { href: '/derivative-of-e-to-the-x', label: 'Derivada de e^x', note: 'e^x. A base é constante, mas o expoente é x, então a derivada não é 0.' },
        { href: '/wiki/power-rule', label: 'Regra da potência', note: 'Inclui a regra da constante como o caso em que a potência de x é zero.' },
      ],
      relatedHeading: 'Derivadas relacionadas',
    },
  },
  'derivative-of-arctan-x': {
    en: {
      title: 'Derivative of arctan(x) = 1/(1+x^2)',
      h1: 'Derivative of arctan(x) is 1/(1+x^2)',
      description: 'The derivative of arctan(x), tan^-1(x), and atan(x) is 1/(1+x^2) for every real x. Proof, arctan(2x), and the tan mix-up.',
      lead: 'The derivative of arctan(x) is 1/(1 + x^2) for every real x.',
    },
    es: {
      title: 'Derivada de arctan(x) = 1/(1+x^2)',
      h1: 'La derivada de arctan(x) es 1/(1+x^2)',
      description: 'La derivada de arctan(x), tan^-1(x) y atan(x) es 1/(1+x^2) para todo real. Demostración, arctan(2x) y la confusión con tan.',
      lead: 'La derivada de arctan(x) es 1/(1 + x^2) para todo x real.',
    },
    pt: {
      title: 'Derivada de arctan(x) = 1/(1+x^2)',
      h1: 'A derivada de arctan(x) é 1/(1+x^2)',
      description: 'A derivada de arctan(x), tan^-1(x) e atan(x) é 1/(1+x^2) para todo real. Prova, arctan(2x) e a confusão com tan.',
      lead: 'A derivada de arctan(x) é 1/(1 + x^2) para todo x real.',
    },
  },
  'derivative-of-2x': {
    en: {
      title: 'Derivative of 2x = 2',
      h1: 'Derivative of 2x is 2',
      description: 'The derivative of 2x is 2. A difference-quotient proof, why the constant factor survives, and the tangent line at x = 3.',
      lead: 'The derivative of 2x is 2 for every real x.',
      paragraphs: [
        'The graph of y = 2x is a straight line through the origin with slope 2. A derivative is a slope, so the answer cannot depend on x: every tangent line to a straight line is the line itself. Any expression that still contains x, such as 2x or x^2, describes a curve whose steepness changes from point to point, and 2x is not a curve.',
        'The difference quotient makes this exact. f(x+h) - f(x) = 2(x+h) - 2x = 2h, and dividing by h leaves 2 before the limit is even taken. The h cancels completely, so there is nothing left for h -> 0 to change. Replacing the coefficient 2 by any constant k gives k, which is the constant multiple rule in its simplest case.',
        'Adding a constant does not change the slope either, so the derivative of 2x + 7 is still 2. Multiplying by a function of x is different: the derivative of 2x sin(x) needs the product rule and equals 2 sin(x) + 2x cos(x), which varies with x. The 2 in 2x is a coefficient of x, not a second function composed with it.',
      ],
      stepsHeading: 'Difference quotient, checked two other ways',
      steps: [
        'Set f(x) = 2x and form the difference quotient (f(x+h) - f(x))/h.',
        'Expand f(x+h) = 2(x+h) = 2x + 2h.',
        'Subtract f(x): (2x + 2h) - 2x = 2h.',
        'Divide by h, with h not zero: 2h/h = 2. The quotient is already constant.',
        'Take the limit as h approaches 0. The limit of the constant 2 is 2.',
        'Check with the power rule: 2x = 2x^1, so the derivative is 2·1·x^0 = 2.',
        'Check with the constant multiple rule: d/dx [2·x] = 2·d/dx[x] = 2·1 = 2.',
      ],
      example: {
        heading: 'Worked example',
        title: 'Tangent line to y = 2x at x = 3, and to the shifted line y = 2x + 7',
        steps: [
          'At x = 3 the point on y = 2x is (3, 6), and the derivative gives a slope of 2.',
          'The tangent line is y - 6 = 2(x - 3), which simplifies back to y = 2x. A line is its own tangent.',
          'For y = 2x + 7 the point is (3, 13) and the slope is still 2, giving y - 13 = 2(x - 3), or y = 2x + 7.',
          'A secant from x = 3 to x = 3.001 rises by 0.002 over 0.001, a slope of exactly 2. The ratio is 2 at every starting point.',
        ],
        answer: '2',
      },
      mistakes: [
        {
          title: 'Answering 2x',
          text: '2x is the function, not its rate of change. The difference quotient cancels x completely, so a correct answer here has no x in it. If a computed derivative of a linear function still contains the variable, the subtraction step was skipped.',
        },
        {
          title: 'Answering 1 or x',
          text: 'The derivative of x is 1, and the constant multiple rule then multiplies that 1 by 2. Dropping the coefficient gives 1; keeping x gives a slope that grows with x. Both contradict the straight-line graph.',
        },
        {
          title: 'Inventing a chain-rule factor',
          text: '2x is a product of a constant and x, not a composition. There is no inner function whose derivative must be brought down. Chain-rule factors appear for expressions like sin(2x), where the inner function 2x genuinely contributes a factor of 2.',
        },
      ],
      faqs: [
        {
          question: 'What is the derivative of 2x?',
          answer: 'The derivative of 2x is 2. The function is a straight line of slope 2, so its rate of change is constant.',
        },
        {
          question: 'Why is the derivative of 2x a constant and not a function of x?',
          answer: 'The difference quotient is (2(x+h) - 2x)/h = 2h/h = 2. The variable cancels before the limit, so the slope is the same at every x.',
        },
        {
          question: 'Does adding a constant change the derivative of 2x?',
          answer: 'No. The derivative of 2x + 7 is also 2. Adding a constant shifts the line vertically without changing its slope.',
        },
        {
          question: 'What is the derivative of 2x sin(x)?',
          answer: 'Use the product rule: 2 sin(x) + 2x cos(x). Unlike 2x alone, this slope varies with x because sin(x) is a function of x.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-5x', label: 'Derivative of 5x', note: '5. The same constant multiple rule with a different coefficient.' },
        { href: '/derivative-of-x-squared', label: 'Derivative of x^2', note: '2x. A slope that really does depend on x, unlike this page.' },
        { href: '/wiki/power-rule', label: 'Power rule', note: 'Turns 2x^1 into 2x^0 = 2 in one step.' },
      ],
      relatedHeading: 'Related derivatives',
    },
    es: {
      title: 'Derivada de 2x = 2',
      h1: 'La derivada de 2x es 2',
      description: 'La derivada de 2x es 2. Demostración con el cociente incremental, la regla del factor constante y la recta tangente en x = 3.',
      lead: 'La derivada de 2x es 2 para todo x real.',
    },
    pt: {
      title: 'Derivada de 2x = 2',
      h1: 'A derivada de 2x é 2',
      description: 'A derivada de 2x é 2. Prova pelo quociente das diferenças, regra do fator constante e reta tangente em x = 3.',
      lead: 'A derivada de 2x é 2 para todo x real.',
    },
  },
  'derivative-of-sin-x': {
    en: {
      title: 'Derivative of sin(x) = cos(x)',
      h1: 'Derivative of sin(x) is cos(x)',
      description: 'The derivative of sin(x) is cos(x). The addition-formula proof, the two special limits behind it, and the slope at pi/3.',
      lead: 'The derivative of sin(x) is cos(x), provided x is measured in radians.',
      paragraphs: [
        'Radians are not a cosmetic choice here. The special limit sin(h)/h -> 1 holds only when h is a pure number, which is what an angle in radians is. In degrees the same limit picks up a factor of pi/180, and every trigonometric derivative would carry an extra constant. This is the main reason calculus uses radians.',
        'The proof starts from the addition formula sin(x+h) = sin(x)cos(h) + cos(x)sin(h). Subtracting sin(x) and dividing by h splits the quotient into two pieces: sin(x)·(cos(h)-1)/h and cos(x)·sin(h)/h. The first tends to 0 and the second tends to cos(x), so the whole expression tends to cos(x). No graph reading is required.',
        'The result matches the shape of the sine wave. Where sin(x) climbs most steeply, near x = 0, cos(x) is close to 1. At the peaks x = pi/2 and x = -pi/2 the slope is 0 and cos(x) vanishes. Where sine falls, cosine is negative. Differentiating once more gives -sin(x), which is why the second derivative of sine is the original function with a minus sign.',
      ],
      stepsHeading: 'Proof from the addition formula',
      steps: [
        'Write the difference quotient (sin(x+h) - sin(x))/h.',
        'Expand sin(x+h) = sin(x)cos(h) + cos(x)sin(h).',
        'Subtract sin(x) and group: sin(x)(cos(h)-1)/h + cos(x)sin(h)/h.',
        'Use the first special limit: (cos(h)-1)/h -> 0, so the sin(x) term vanishes.',
        'Use the second special limit: sin(h)/h -> 1, so the cos(x) term becomes cos(x).',
        'Conclude d/dx sin(x) = cos(x). Both limits require h in radians.',
        'Check at x = 0: cos(0) = 1, the steepest positive slope of the sine curve.',
      ],
      example: {
        heading: 'Worked example',
        title: 'Slope of sin(x) at x = pi/3',
        steps: [
          'The derivative at any point is cos(x), so evaluate cos(pi/3).',
          'cos(pi/3) = 1/2. The sine curve is rising at half the steepness it has at the origin.',
          'The point itself is (pi/3, sin(pi/3)) = (pi/3, √3/2), about (1.047, 0.866).',
          'The tangent line is y - √3/2 = (1/2)(x - pi/3). A secant to pi/3 + 0.001 has a slope near 0.5, not 0.866.',
        ],
        answer: '1/2',
      },
      mistakes: [
        {
          title: 'Answering -cos(x)',
          text: 'A minus sign appears when differentiating cos(x), whose derivative is -sin(x), or on the second derivative of sin(x). Sine itself has a positive slope near the origin, so its derivative there must be positive.',
        },
        {
          title: 'Using degrees',
          text: 'With x in degrees, d/dx sin(x) = (pi/180)cos(x). The extra factor comes from sin(h)/h -> pi/180 for h measured in degrees. Stating the radian convention is part of stating the derivative.',
        },
        {
          title: 'Confusing sin(x)^2 with sin(x^2)',
          text: 'This page covers sin(x) alone. sin(x)^2 needs the chain rule on the outer square and gives 2 sin(x)cos(x); sin(x^2) needs it on the inner x^2 and gives 2x cos(x^2). Neither is cos(x).',
        },
      ],
      faqs: [
        {
          question: 'What is the derivative of sin(x)?',
          answer: 'The derivative of sin(x) is cos(x), with x measured in radians.',
        },
        {
          question: 'Why does the derivative of sin(x) need radians?',
          answer: 'The proof uses sin(h)/h -> 1, which is true only for h in radians. In degrees the limit is pi/180 and the derivative gains that factor.',
        },
        {
          question: 'What is the slope of sin(x) at pi/3?',
          answer: 'cos(pi/3) = 1/2. The tangent line passes through (pi/3, √3/2) with slope 1/2.',
        },
        {
          question: 'What is the second derivative of sin(x)?',
          answer: 'Differentiating cos(x) gives -sin(x). The second derivative is minus the original function, the equation behind simple harmonic motion.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-cos-x', label: 'Derivative of cos(x)', note: '-sin(x). The companion result, with the minus sign this page does not have.' },
        { href: '/derivative-of-sin-2x', label: 'Derivative of sin(2x)', note: '2cos(2x). Chain rule on the same outer sine function.' },
        { href: '/wiki/trigonometric-derivatives', label: 'Trigonometric derivatives', note: 'All six trig derivatives and the limits they rest on.' },
      ],
      relatedHeading: 'Related derivatives',
    },
    es: {
      title: 'Derivada de sin(x) = cos(x)',
      h1: 'La derivada de sin(x) es cos(x)',
      description: 'La derivada de sin(x) es cos(x). Demostración con la fórmula de adición, los dos límites notables y la pendiente en pi/3.',
      lead: 'La derivada de sin(x) es cos(x), siempre que x se mida en radianes.',
    },
    pt: {
      title: 'Derivada de sin(x) = cos(x)',
      h1: 'A derivada de sin(x) é cos(x)',
      description: 'A derivada de sin(x) é cos(x). Prova pela fórmula de adição, os dois limites notáveis e a inclinação em pi/3.',
      lead: 'A derivada de sin(x) é cos(x), com x medido em radianos.',
    },
  },
  'derivative-of-ln-x': {
    en: {
      title: 'Derivative of ln(x) = 1/x',
      h1: 'Derivative of ln(x) is 1/x',
      description: 'The derivative of ln(x) is 1/x for x > 0. Inverse-function proof from e^y, the natural-log domain, and the slope at x = e.',
      lead: 'The derivative of ln(x) is 1/x, defined only for x > 0.',
      paragraphs: [
        'The natural logarithm has no values for x <= 0, so neither does its derivative. Writing 1/x without that restriction is shorthand; the full statement is d/dx ln(x) = 1/x on the domain x > 0. The related function ln|x| is defined on both sides of zero and has derivative 1/x for every nonzero x, which is where the two formulas are often mixed up.',
        'The cleanest proof treats ln(x) as the inverse of e^y. Set y = ln(x), so x = e^y. Differentiating both sides with respect to x gives 1 = e^y·dy/dx, and since e^y = x, solving for dy/dx yields 1/x. The derivative of e^y does all the work, and it is why the natural logarithm, not log base 10, differentiates so simply.',
        'The graph agrees. Near x = 0 the logarithm dives steeply toward negative infinity and 1/x is large; as x grows the curve flattens and 1/x tends to 0. The slope is always positive, so ln(x) is increasing on its whole domain, but it grows more and more slowly. For log base 10 the extra factor 1/ln(10) appears, roughly 0.434/x.',
      ],
      stepsHeading: 'Inverse-function proof from x = e^y',
      steps: [
        'Set y = ln(x). By the definition of the natural log, x = e^y.',
        'Differentiate both sides with respect to x: 1 = e^y·dy/dx.',
        'Substitute e^y = x back into that equation: 1 = x·dy/dx.',
        'Solve for dy/dx = 1/x, valid where x > 0.',
        'State the domain explicitly: ln(x) is undefined for x <= 0, so 1/x is a derivative there only on the positive half-line.',
        'Contrast with log base 10: d/dx log10(x) = 1/(x ln(10)). The change-of-base factor survives differentiation.',
        'Contrast with ln|x|: on the negative half-line its derivative is also 1/x, but the function itself is ln(-x) there.',
      ],
      example: {
        heading: 'Worked example',
        title: 'Slope of ln(x) at x = e and at x = 1',
        steps: [
          'At x = e the function value is ln(e) = 1 and the derivative is 1/e, about 0.368.',
          'The tangent line at that point is y - 1 = (1/e)(x - e), which simplifies to y = x/e.',
          'At x = 1 the value is 0 and the derivative is 1, so the tangent there is y = x - 1.',
          'A secant from 1 to 1.001 gives ln(1.001)/0.001, about 0.9995, confirming the slope near 1 is 1.',
        ],
        answer: '1/e',
      },
      mistakes: [
        {
          title: 'Writing 1/|x| for ln(x)',
          text: 'ln(x) is only defined for positive x, so 1/x is already positive on its whole domain. The absolute value belongs to the derivative of ln|x|, a different function defined for negative x as well.',
        },
        {
          title: 'Forgetting the ln(10) factor for log(x)',
          text: 'If log means base 10, the derivative is 1/(x ln(10)), not 1/x. Only the natural logarithm, base e, differentiates to 1/x without an extra constant.',
        },
        {
          title: 'Evaluating at x = 0 or a negative x',
          text: 'ln(0) and ln(-3) are undefined, so there is no slope at those points. The expression 1/x may produce a number, but a derivative cannot exist where the function has no value.',
        },
      ],
      faqs: [
        {
          question: 'What is the derivative of ln(x)?',
          answer: 'The derivative of ln(x) is 1/x, for x > 0 only.',
        },
        {
          question: 'Why is the derivative of ln(x) equal to 1/x?',
          answer: 'Write x = e^y with y = ln(x). Differentiating gives 1 = e^y·dy/dx = x·dy/dx, so dy/dx = 1/x.',
        },
        {
          question: 'What is the derivative of ln|x|?',
          answer: 'It is 1/x for every x not equal to 0, including negative x. That is the antiderivative form; ln(x) alone is restricted to x > 0.',
        },
        {
          question: 'What is the slope of ln(x) at x = e?',
          answer: 'It is 1/e, about 0.368. The tangent line at (e, 1) is y = x/e.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-log-x', label: 'Derivative of log(x)', note: '1/(x ln(10)) when the base is 10. The extra constant is the whole difference.' },
        { href: '/derivative-of-e-to-the-x', label: 'Derivative of e^x', note: 'e^x. The inverse function used in the proof above.' },
        { href: '/wiki/logarithmic-derivatives', label: 'Logarithmic derivatives', note: 'The chain-rule form d/dx ln(f(x)) = f\'(x)/f(x).' },
      ],
      relatedHeading: 'Related derivatives',
    },
    es: {
      title: 'Derivada de ln(x) = 1/x',
      h1: 'La derivada de ln(x) es 1/x',
      description: 'La derivada de ln(x) es 1/x para x > 0. Demostración por la función inversa e^y, el dominio y la pendiente en x = e.',
      lead: 'La derivada de ln(x) es 1/x, definida solo para x > 0.',
    },
    pt: {
      title: 'Derivada de ln(x) = 1/x',
      h1: 'A derivada de ln(x) é 1/x',
      description: 'A derivada de ln(x) é 1/x para x > 0. Prova pela função inversa e^y, o domínio e a inclinação em x = e.',
      lead: 'A derivada de ln(x) é 1/x, definida apenas para x > 0.',
    },
  },
  'derivative-of-e-to-the-x': {
    en: {
      title: 'Derivative of e^x = e^x',
      h1: 'Derivative of e^x is e^x',
      description: 'The derivative of e^x is e^x. Why e is the base with slope 1 at the origin, the defining limit, and checks at x = 0 and x = ln(2).',
      lead: 'The derivative of e^x is e^x: the function is its own derivative.',
      paragraphs: [
        'For a general base a, the derivative of a^x is a^x ln(a). The number e is the unique base for which ln(a) = 1, so the extra factor disappears. Equivalently, e is chosen so that the slope of a^x at x = 0 is exactly 1. Every other exponential is a constant multiple of that slope, which is why e^x is the natural one to differentiate.',
        'From the definition, (e^(x+h) - e^x)/h = e^x (e^h - 1)/h. The limit (e^h - 1)/h -> 1 is the defining property of e, so the difference quotient tends to e^x. The limit is not an approximation: it is what the number e was selected to satisfy.',
        'A function equal to its own derivative grows at a rate proportional to its size. At x = 0 the value and the slope are both 1; at x = ln(2) both are 2; at x = 5 both are about 148.4. This is the reason e^x models unconstrained growth, and why adding a constant multiple C·e^x still solves y\' = y.',
      ],
      stepsHeading: 'From the difference quotient to the fixed point',
      steps: [
        'Write the difference quotient (e^(x+h) - e^x)/h.',
        'Factor out e^x using e^(x+h) = e^x·e^h, giving e^x (e^h - 1)/h.',
        'Use the defining limit of e: (e^h - 1)/h -> 1 as h approaches 0.',
        'Multiply: e^x·1 = e^x. The derivative equals the original function.',
        'Contrast with a general base: d/dx a^x = a^x ln(a). Only a = e removes the factor.',
        'Check at x = 0: e^0 = 1 and the slope is 1, so the tangent line is y = x + 1.',
        'Check the chain rule on e^(2x): the inner derivative 2 comes down, giving 2e^(2x).',
      ],
      example: {
        heading: 'Worked example',
        title: 'Value and slope of e^x at x = ln(2), and the tangent at x = 0',
        steps: [
          'At x = ln(2), e^x = 2. Because the derivative is the same function, the slope there is also 2.',
          'The tangent line at that point is y - 2 = 2(x - ln(2)).',
          'At x = 0 the value is 1 and the slope is 1, so the tangent line is y - 1 = x, or y = x + 1.',
          'A secant from 0 to 0.001 gives (e^0.001 - 1)/0.001, about 1.0005, confirming the unit slope at the origin.',
        ],
        answer: '2',
      },
      mistakes: [
        {
          title: 'Applying the power rule and answering x·e^(x-1)',
          text: 'The power rule applies when the exponent is a constant and x is the base. In e^x the base is constant and x is the exponent, so the rule does not apply. x·e^(x-1) is not the derivative of any elementary exponential.',
        },
        {
          title: 'Forgetting ln(a) for other bases',
          text: 'The derivative of 2^x is 2^x ln(2), about 0.693·2^x. Dropping that factor and writing e^x also changes the base, not just the coefficient.',
        },
        {
          title: 'Dropping the chain-rule factor on e^(kx)',
          text: 'The derivative of e^(2x) is 2e^(2x) and of e^(-x) is -e^(-x). The exponent is a function of x, so its derivative must come down as a factor.',
        },
      ],
      faqs: [
        {
          question: 'What is the derivative of e^x?',
          answer: 'The derivative of e^x is e^x. It is the only function (up to a constant multiple) equal to its own derivative.',
        },
        {
          question: 'Why does e^x differentiate to itself?',
          answer: 'The difference quotient is e^x(e^h - 1)/h, and e is defined so that (e^h - 1)/h -> 1. The quotient therefore tends to e^x.',
        },
        {
          question: 'What is the derivative of 2^x?',
          answer: 'It is 2^x ln(2). For a general base a the derivative of a^x is a^x ln(a); e is the base where ln(a) = 1.',
        },
        {
          question: 'What is the derivative of e^(2x)?',
          answer: 'Use the chain rule: 2e^(2x). The derivative of the inner 2x comes down as a factor of 2.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-2-to-the-x', label: 'Derivative of 2^x', note: '2^x ln(2). The general-base formula with its constant factor visible.' },
        { href: '/derivative-of-e-to-the-2x', label: 'Derivative of e^(2x)', note: '2e^(2x). Chain rule on the same exponential.' },
        { href: '/wiki/exponential-derivatives', label: 'Exponential derivatives', note: 'The a^x ln(a) rule and its chain-rule variants.' },
      ],
      relatedHeading: 'Related derivatives',
    },
    es: {
      title: 'Derivada de e^x = e^x',
      h1: 'La derivada de e^x es e^x',
      description: 'La derivada de e^x es e^x. Por qué e es la base con pendiente 1 en el origen, el límite que la define y comprobaciones en x = 0 y x = ln(2).',
      lead: 'La derivada de e^x es e^x: la función es su propia derivada.',
    },
    pt: {
      title: 'Derivada de e^x = e^x',
      h1: 'A derivada de e^x é e^x',
      description: 'A derivada de e^x é e^x. Por que e é a base com inclinação 1 na origem, o limite que a define e verificações em x = 0 e x = ln(2).',
      lead: 'A derivada de e^x é e^x: a função é a própria derivada.',
    },
  },
  'derivative-of-sin-2x': {
    en: {
      title: 'Derivative of sin(2x) = 2cos(2x)',
      h1: 'Derivative of sin(2x) is 2cos(2x)',
      description: 'The derivative of sin(2x) is 2cos(2x). Chain-rule derivation, a product-rule cross-check, and the slope at x = pi/6.',
      lead: 'The derivative of sin(2x) is 2cos(2x), with x in radians.',
      paragraphs: [
        'This is a composition, not a product: the outer function is sin(u) and the inner function is u = 2x. The chain rule says to differentiate the outer function with respect to u, keep u = 2x in the result, and multiply by du/dx. Differentiating sin(u) gives cos(u), and the derivative of 2x is 2, so the answer is 2cos(2x).',
        'The factor 2 is easy to lose because it looks like the coefficient of a constant multiple. It is not: it comes from the rate at which the inner angle 2x changes. Doubling the angle doubles the frequency of the wave, so its peaks arrive twice as often and every slope along it is twice as steep as the corresponding slope of sin(x).',
        'An independent check comes from the double-angle identity sin(2x) = 2 sin(x)cos(x). The product rule gives 2[cos(x)cos(x) + sin(x)(-sin(x))] = 2[cos(x)^2 - sin(x)^2] = 2cos(2x). Both routes agree, which is a useful way to catch a missing inner derivative.',
      ],
      stepsHeading: 'Chain rule, then a product-rule cross-check',
      steps: [
        'Name the layers: outer f(u) = sin(u), inner u = 2x.',
        'Differentiate the outer function: f\'(u) = cos(u).',
        'Differentiate the inner function: du/dx = 2.',
        'Apply the chain rule: d/dx sin(2x) = cos(u)·2 = 2cos(2x).',
        'Check with sin(2x) = 2 sin(x)cos(x) and the product rule.',
        'Product rule gives 2[cos(x)^2 - sin(x)^2], which is 2cos(2x) by the double-angle identity.',
        'Sanity check at x = 0: the slope is 2cos(0) = 2, twice the slope of sin(x) at the origin.',
      ],
      example: {
        heading: 'Worked example',
        title: 'Slope of sin(2x) at x = pi/6',
        steps: [
          'Evaluate the inner angle: 2·(pi/6) = pi/3.',
          'The function value is sin(pi/3) = √3/2, about 0.866.',
          'The derivative is 2cos(pi/3) = 2·(1/2) = 1.',
          'The tangent line is y - √3/2 = 1·(x - pi/6). A secant to pi/6 + 0.001 has a slope near 1, not 0.5 or 2.',
        ],
        answer: '1',
      },
      mistakes: [
        {
          title: 'Answering cos(2x) and losing the 2',
          text: 'Differentiating only the outer sine gives cos(2x). The inner derivative du/dx = 2 must be multiplied in. At x = 0 the true slope is 2, so omitting the factor halves every slope on the curve.',
        },
        {
          title: 'Answering 2cos(x)',
          text: 'The angle inside the cosine stays 2x. Replacing cos(2x) with cos(x) changes the frequency of the derivative and gives a slope of 2 at x = pi/2, where sin(2x) actually has a slope of -2.',
        },
        {
          title: 'Treating sin(2x) as 2sin(x)',
          text: 'sin(2x) is not 2 sin(x); the correct identity is 2 sin(x)cos(x). Using the wrong identity produces 2cos(x) and drops the double-angle behaviour entirely.',
        },
      ],
      faqs: [
        {
          question: 'What is the derivative of sin(2x)?',
          answer: 'The derivative of sin(2x) is 2cos(2x), with x in radians.',
        },
        {
          question: 'Why does the chain rule add a factor of 2?',
          answer: 'The inner function is 2x, whose derivative is 2. The chain rule multiplies cos(2x) by that inner derivative.',
        },
        {
          question: 'What is the slope of sin(2x) at pi/6?',
          answer: '2cos(pi/3) = 1. The curve passes through (pi/6, √3/2) with slope 1.',
        },
        {
          question: 'What is the second derivative of sin(2x)?',
          answer: 'Differentiate 2cos(2x) with the chain rule again: -4sin(2x). Each differentiation brings down another factor of 2.',
        },
      ],
      extraRelated: [
        { href: '/derivative-of-cos-2x', label: 'Derivative of cos(2x)', note: '-2sin(2x). The same chain rule with a cosine outer function.' },
        { href: '/derivative-of-sin-x', label: 'Derivative of sin(x)', note: 'cos(x). This page is that result with the angle doubled.' },
        { href: '/wiki/chain-rule', label: 'Chain rule', note: 'Differentiate the outer layer, keep the inner argument, multiply by the inner derivative.' },
      ],
      relatedHeading: 'Related derivatives',
    },
    es: {
      title: 'Derivada de sin(2x) = 2cos(2x)',
      h1: 'La derivada de sin(2x) es 2cos(2x)',
      description: 'La derivada de sin(2x) es 2cos(2x). Demostración con la regla de la cadena, comprobación con el producto y la pendiente en x = pi/6.',
      lead: 'La derivada de sin(2x) es 2cos(2x), con x en radianes.',
    },
    pt: {
      title: 'Derivada de sin(2x) = 2cos(2x)',
      h1: 'A derivada de sin(2x) é 2cos(2x)',
      description: 'A derivada de sin(2x) é 2cos(2x). Prova pela regra da cadeia, verificação pelo produto e a inclinação em x = pi/6.',
      lead: 'A derivada de sin(2x) é 2cos(2x), com x em radianos.',
    },
  },
};

function isBody(value: StrikingBody | StrikingMeta): value is StrikingBody {
  return 'steps' in value;
}

export function strikingMeta(slug: string, locale: string): StrikingMeta | null {
  const loc = normalizeLocale(locale);
  const row = STRIKING[slug]?.[loc];
  if (!row) return null;
  return {
    title: row.title,
    h1: row.h1,
    description: row.description,
    lead: row.lead,
  };
}

export function strikingLead(slug: string, locale: string): string | null {
  return strikingMeta(slug, locale)?.lead ?? null;
}

function mergeRelated(existing: RelatedLink[], extra: RelatedLink[]): RelatedLink[] {
  const seen = new Set(existing.map((item) => item.href));
  const front = extra.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
  return [...front, ...existing];
}

/** Replace the generated lesson body on the three pages that use DerivativeLesson. */
export function applyStrikingLesson(lesson: DerivativeLesson, locale: string): DerivativeLesson {
  const loc = normalizeLocale(locale);
  const row = STRIKING[lesson.slug]?.[loc];
  if (!row || !isBody(row)) return lesson;
  return {
    ...lesson,
    title: row.title,
    description: row.description,
    paragraphs: row.paragraphs,
    steps: row.steps,
    stepsHeading: row.stepsHeading,
    mistakes: row.mistakes,
    faqs: row.faqs,
    example: row.example,
    relatedHeading: row.relatedHeading,
    related: mergeRelated(lesson.related, row.extraRelated),
  };
}
