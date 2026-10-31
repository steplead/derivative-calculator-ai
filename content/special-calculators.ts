import type { Locale } from '@/lib/seo';

export type SpecialKey = 'partial' | 'implicit' | 'chain';

export type SpecialCopy = {
  description: string;
  h1: string;
  h1Id: string;
  paragraphs: string[];
  faqs: { question: string; answer: string }[];
};

type SpecialPage = {
  path: string;
  wiki: string;
  examples: { href: string; label: string }[];
  copy: Record<Locale, SpecialCopy>;
};

export const SPECIAL_CALCULATORS: Record<SpecialKey, SpecialPage> = {
  partial: {
    path: '/partial-derivative-calculator',
    wiki: '/wiki/partial-derivatives',
    examples: [
      { href: '/derivative-of-x-squared', label: 'd/dx x^2' },
      { href: '/derivative-of-x-sin-x', label: 'd/dx x sin(x)' },
      { href: '/implicit-differentiation-calculator', label: 'Implicit differentiation' },
    ],
    copy: {
      en: {
        description: 'Free partial derivative calculator. Differentiate f(x, y, z) in one variable while the others stay constant, with steps.',
        h1: 'Partial Derivative Calculator',
        h1Id: 'partial-derivative-calculator',
        paragraphs: [
          'A partial derivative asks how a function changes when only one input moves. In f(x, y) = x^2 y + sin(y), ∂/∂x treats y as a constant, so sin(y) drops out and the x^2 y term becomes 2 x y. ∂/∂y treats x as a constant, so x^2 stays in front of y and the sine contributes cos(y).',
          'That is the whole rule. Ordinary power, product, and chain rules still apply to the active variable. A term with no active variable is a constant for that derivative and contributes 0. Mixed seconds, such as ∂²f/∂x∂y, are just one partial followed by another.',
          'Enter an expression in x, y, and z. Pick the variable. The result is the symbolic partial, not a numeric slope at a point. For a function of x alone, the partial with respect to x matches the ordinary derivative.',
        ],
        faqs: [
          { question: 'What is a partial derivative?', answer: 'It is the derivative with respect to one variable while every other variable is held constant.' },
          { question: 'How is a partial different from an ordinary derivative?', answer: 'An ordinary derivative has one independent variable. A partial is the same operation after the other inputs are frozen.' },
          { question: 'What does ∂f/∂y mean for f(x, y)?', answer: 'Differentiate in y and treat x as a constant coefficient or as part of a constant term.' },
          { question: 'Can I differentiate with respect to z?', answer: 'Yes. Choose z. If the expression does not contain z, the partial is 0.' },
        ],
      },
      es: {
        description: 'Calculadora gratis de derivadas parciales. Deriva f(x, y, z) en una variable y deja las demás constantes, con pasos.',
        h1: 'Calculadora de derivadas parciales',
        h1Id: 'calculadora-derivadas-parciales',
        paragraphs: [
          'Una derivada parcial pregunta cómo cambia una función cuando solo se mueve una entrada. En f(x, y) = x^2 y + sin(y), ∂/∂x trata y como constante, así que sin(y) desaparece y x^2 y pasa a 2 x y. ∂/∂y trata x como constante: x^2 se queda delante de y y el seno aporta cos(y).',
          'Esa es toda la regla. Las reglas ordinarias de potencia, producto y cadena siguen valiendo para la variable activa. Un término sin esa variable es constante y aporta 0.',
          'Escribe una expresión en x, y y z y elige la variable. El resultado es la parcial simbólica. Si la función solo depende de x, la parcial respecto de x coincide con la derivada ordinaria.',
        ],
        faqs: [
          { question: '¿Qué es una derivada parcial?', answer: 'Es la derivada respecto de una variable mientras las demás se mantienen constantes.' },
          { question: '¿En qué se diferencia de una derivada ordinaria?', answer: 'La derivada ordinaria tiene una sola variable independiente. La parcial es la misma operación con las otras entradas congeladas.' },
          { question: '¿Qué significa ∂f/∂y?', answer: 'Deriva en y y trata x como un coeficiente constante o como parte de un término constante.' },
          { question: '¿Puedo derivar respecto de z?', answer: 'Sí. Si la expresión no contiene z, la parcial es 0.' },
        ],
      },
      pt: {
        description: 'Calculadora grátis de derivadas parciais. Derive f(x, y, z) numa variável e mantenha as outras constantes, com passos.',
        h1: 'Calculadora de derivadas parciais',
        h1Id: 'calculadora-derivadas-parciais',
        paragraphs: [
          'Uma derivada parcial pergunta como uma função muda quando só uma entrada se move. Em f(x, y) = x^2 y + sin(y), ∂/∂x trata y como constante, então sin(y) some e x^2 y vira 2 x y. ∂/∂y trata x como constante: x^2 fica na frente de y e o seno contribui com cos(y).',
          'Essa é a regra inteira. As regras ordinárias da potência, do produto e da cadeia continuam valendo para a variável ativa. Um termo sem essa variável é constante e contribui 0.',
          'Escreva uma expressão em x, y e z e escolha a variável. O resultado é a parcial simbólica. Se a função só depende de x, a parcial em relação a x coincide com a derivada ordinária.',
        ],
        faqs: [
          { question: 'O que é uma derivada parcial?', answer: 'É a derivada em relação a uma variável enquanto as outras ficam constantes.' },
          { question: 'Qual a diferença para uma derivada ordinária?', answer: 'A derivada ordinária tem uma variável independente. A parcial é a mesma operação com as outras entradas congeladas.' },
          { question: 'O que significa ∂f/∂y?', answer: 'Derive em y e trate x como coeficiente constante ou como parte de um termo constante.' },
          { question: 'Posso derivar em relação a z?', answer: 'Sim. Se a expressão não contém z, a parcial é 0.' },
        ],
      },
    },
  },
  implicit: {
    path: '/implicit-differentiation-calculator',
    wiki: '/wiki/implicit-differentiation',
    examples: [
      { href: '/derivative-of-x-squared', label: 'd/dx x^2' },
      { href: '/partial-derivative-calculator', label: 'Partial derivatives' },
      { href: '/chain-rule-calculator', label: 'Chain rule' },
    ],
    copy: {
      en: {
        description: 'Implicit differentiation calculator. Solve dy/dx from an equation F(x, y) = 0, including circles and other relations that are not functions.',
        h1: 'Implicit Differentiation Calculator',
        h1Id: 'implicit-differentiation-calculator',
        paragraphs: [
          'Some curves are not functions y = f(x). The circle x^2 + y^2 = 25 has two y values for most x. Implicit differentiation still produces the slope: rewrite as F = x^2 + y^2 − 25, then dy/dx = −(∂F/∂x) / (∂F/∂y) = −x/y.',
          'The method is the chain rule in disguise. Every y is a function of x, so differentiating y^2 contributes 2 y dy/dx. You then solve that equation for dy/dx. The partials are only a bookkeeping device that isolates the coefficient of dy/dx.',
          'Enter one equation containing both x and y. The calculator returns dy/dx. If the partial with respect to y is 0, the relation does not determine a slope.',
        ],
        faqs: [
          { question: 'What is implicit differentiation?', answer: 'It finds dy/dx from an equation that mixes x and y, without solving for y first.' },
          { question: 'What is dy/dx for x^2 + y^2 = 25?', answer: '−x/y, wherever y is not zero. The top and bottom of the circle are horizontal; the left and right are vertical.' },
          { question: 'Why do partial derivatives appear?', answer: 'dy/dx = −Fx/Fy. Fx and Fy are partials of F = left − right. They are not a second, unrelated topic.' },
          { question: 'What if the equation has no y?', answer: 'Then it does not define y as a function of x. Use the ordinary derivative calculator instead.' },
        ],
      },
      es: {
        description: 'Calculadora de derivación implícita. Halla dy/dx de una ecuación F(x, y) = 0, incluidos círculos y relaciones que no son funciones.',
        h1: 'Calculadora de derivación implícita',
        h1Id: 'calculadora-derivacion-implicita',
        paragraphs: [
          'Algunas curvas no son funciones y = f(x). El círculo x^2 + y^2 = 25 tiene dos valores de y para casi todo x. La derivación implícita igual da la pendiente: F = x^2 + y^2 − 25 y dy/dx = −(∂F/∂x)/(∂F/∂y) = −x/y.',
          'El método es la regla de la cadena disfrazada. Cada y es función de x, así que derivar y^2 aporta 2 y dy/dx. Después se despeja dy/dx. Las parciales solo aíslan el coeficiente de dy/dx.',
          'Escribe una ecuación con x y con y. La calculadora devuelve dy/dx. Si la parcial respecto de y es 0, la relación no determina una pendiente.',
        ],
        faqs: [
          { question: '¿Qué es la derivación implícita?', answer: 'Halla dy/dx de una ecuación que mezcla x e y, sin despejar y primero.' },
          { question: '¿Cuánto es dy/dx en x^2 + y^2 = 25?', answer: '−x/y, donde y no es cero. Arriba y abajo del círculo la tangente es horizontal.' },
          { question: '¿Por qué aparecen derivadas parciales?', answer: 'Porque dy/dx = −Fx/Fy. Fx y Fy son las parciales de F = izquierda − derecha.' },
          { question: '¿Y si la ecuación no tiene y?', answer: 'Entonces no define y como función de x. Usa la calculadora de derivadas ordinaria.' },
        ],
      },
      pt: {
        description: 'Calculadora de derivação implícita. Ache dy/dx de uma equação F(x, y) = 0, incluindo círculos e relações que não são funções.',
        h1: 'Calculadora de derivação implícita',
        h1Id: 'calculadora-derivacao-implicita',
        paragraphs: [
          'Algumas curvas não são funções y = f(x). O círculo x^2 + y^2 = 25 tem dois valores de y para quase todo x. A derivação implícita ainda dá a inclinação: F = x^2 + y^2 − 25 e dy/dx = −(∂F/∂x)/(∂F/∂y) = −x/y.',
          'O método é a regra da cadeia disfarçada. Cada y é função de x, então derivar y^2 contribui com 2 y dy/dx. Depois isola-se dy/dx. As parciais só separam o coeficiente de dy/dx.',
          'Escreva uma equação com x e com y. A calculadora devolve dy/dx. Se a parcial em relação a y é 0, a relação não determina uma inclinação.',
        ],
        faqs: [
          { question: 'O que é derivação implícita?', answer: 'Acha dy/dx de uma equação que mistura x e y, sem isolar y primeiro.' },
          { question: 'Quanto é dy/dx em x^2 + y^2 = 25?', answer: '−x/y, onde y não é zero. No topo e na base do círculo a tangente é horizontal.' },
          { question: 'Por que aparecem derivadas parciais?', answer: 'Porque dy/dx = −Fx/Fy. Fx e Fy são as parciais de F = esquerda − direita.' },
          { question: 'E se a equação não tem y?', answer: 'Então ela não define y como função de x. Use a calculadora de derivadas comum.' },
        ],
      },
    },
  },
  chain: {
    path: '/chain-rule-calculator',
    wiki: '/wiki/chain-rule',
    examples: [
      { href: '/derivative-of-sin-2x', label: 'Derivative of sin(2x)' },
      { href: '/derivative-of-e-to-the-2x', label: 'Derivative of e^(2x)' },
      { href: '/derivative-of-ln-2x', label: 'Derivative of ln(2x)' },
    ],
    copy: {
      en: {
        description: 'Chain rule calculator with steps. See the outer derivative, the inner derivative, and the product for composite functions such as sin(2x).',
        h1: 'Chain Rule Calculator',
        h1Id: 'chain-rule-calculator',
        paragraphs: [
          'The chain rule differentiates a function of a function. If y = f(u) and u = g(x), then dy/dx = f\'(u) · g\'(x). For sin(2x) the outside is sin(u), whose derivative is cos(u), and the inside 2x has derivative 2. Multiply to get 2 cos(2x).',
          'The factor from the inside is the part that gets dropped. cos(2x) is not the derivative of sin(2x). e^(2x) is not the derivative of itself; the 2 stays in front. ln(2x) is the exception that looks like a cancellation: the chain rule multiplies by 2 and the 2 in the denominator cancels, leaving 1/x.',
          'Enter a composite such as sin(2*x), exp(x^2), or (x+1)^5. The calculator names the outer function, the inner function, both derivatives, and the simplified result. You can check a derivative you computed by hand on the same page.',
        ],
        faqs: [
          { question: 'What is the chain rule?', answer: 'The derivative of f(g(x)) is f\'(g(x)) times g\'(x).' },
          { question: 'What is the derivative of sin(2x)?', answer: '2 cos(2x). The 2 is the derivative of the inside.' },
          { question: 'When is the inner derivative equal to 1?', answer: 'When the inside is x itself, as in sin(x) or e^x. The chain rule still applies; the extra factor is invisible.' },
          { question: 'Does the chain rule replace the product rule?', answer: 'No. A product of two functions of x uses the product rule. Each factor may then need the chain rule of its own.' },
        ],
      },
      es: {
        description: 'Calculadora de la regla de la cadena con pasos. Muestra la derivada exterior, la interior y el producto en funciones como sin(2x).',
        h1: 'Calculadora de la regla de la cadena',
        h1Id: 'calculadora-regla-de-la-cadena',
        paragraphs: [
          'La regla de la cadena deriva una función de una función. Si y = f(u) y u = g(x), entonces dy/dx = f\'(u) · g\'(x). En sin(2x) el exterior es sin(u), cuya derivada es cos(u), y el interior 2x tiene derivada 2. El producto es 2 cos(2x).',
          'El factor interior es lo que se suele olvidar. cos(2x) no es la derivada de sin(2x). e^(2x) no es su propia derivada; el 2 se queda delante. ln(2x) es la excepción que parece una cancelación: la cadena multiplica por 2 y el 2 del denominador se cancela, y queda 1/x.',
          'Escribe una compuesta como sin(2*x), exp(x^2) o (x+1)^5. La calculadora nombra la función exterior, la interior, las dos derivadas y el resultado simplificado.',
        ],
        faqs: [
          { question: '¿Qué es la regla de la cadena?', answer: 'La derivada de f(g(x)) es f\'(g(x)) por g\'(x).' },
          { question: '¿Cuál es la derivada de sin(2x)?', answer: '2 cos(2x). El 2 es la derivada del interior.' },
          { question: '¿Cuándo la derivada interior vale 1?', answer: 'Cuando el interior es x, como en sin(x) o e^x. La regla sigue aplicando; el factor extra no se ve.' },
          { question: '¿La cadena reemplaza a la regla del producto?', answer: 'No. Un producto de dos funciones de x usa la regla del producto. Cada factor puede necesitar después la cadena.' },
        ],
      },
      pt: {
        description: 'Calculadora da regra da cadeia com passos. Mostra a derivada externa, a interna e o produto em funções como sin(2x).',
        h1: 'Calculadora da regra da cadeia',
        h1Id: 'calculadora-regra-da-cadeia',
        paragraphs: [
          'A regra da cadeia deriva uma função de uma função. Se y = f(u) e u = g(x), então dy/dx = f\'(u) · g\'(x). Em sin(2x) o exterior é sin(u), cuja derivada é cos(u), e o interior 2x tem derivada 2. O produto é 2 cos(2x).',
          'O fator interno é o que se costuma esquecer. cos(2x) não é a derivada de sin(2x). e^(2x) não é a própria derivada; o 2 fica na frente. ln(2x) é a exceção que parece um cancelamento: a cadeia multiplica por 2 e o 2 do denominador cancela, sobrando 1/x.',
          'Escreva uma composta como sin(2*x), exp(x^2) ou (x+1)^5. A calculadora nomeia a função externa, a interna, as duas derivadas e o resultado simplificado.',
        ],
        faqs: [
          { question: 'O que é a regra da cadeia?', answer: 'A derivada de f(g(x)) é f\'(g(x)) vezes g\'(x).' },
          { question: 'Qual é a derivada de sin(2x)?', answer: '2 cos(2x). O 2 é a derivada do interior.' },
          { question: 'Quando a derivada interna vale 1?', answer: 'Quando o interior é x, como em sin(x) ou e^x. A regra continua valendo; o fator extra fica invisível.' },
          { question: 'A cadeia substitui a regra do produto?', answer: 'Não. Um produto de duas funções de x usa a regra do produto. Cada fator pode precisar da cadeia depois.' },
        ],
      },
    },
  },
};

export function specialPlainText(copy: SpecialCopy): string {
  return [copy.h1, copy.paragraphs.join(' '), copy.faqs.map((faq) => `${faq.question} ${faq.answer}`).join(' ')].join(' ');
}
