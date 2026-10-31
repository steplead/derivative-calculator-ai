/**
 * Homepage study guide. FAQ answers are the exact strings rendered on the page
 * and emitted as FAQPage JSON-LD — keep them in sync by reading this module
 * from both places.
 */

import type { Locale } from '@/lib/seo';

export type HomeFaq = { question: string; answer: string };

export type HomeSection = {
    id: string;
    heading: string;
    paragraphs: string[];
};

export type HomeGuide = {
    lede: string;
    sections: HomeSection[];
    faqs: HomeFaq[];
    examplesHeading: string;
    examples: Array<{ href: string; label: string; detail: string }>;
};

const en: HomeGuide = {
    lede: 'Use this derivative solver when you need the derivative, the rule that produced it, and the steps in between. It is free, it does not ask you to create an account, and the same calculator runs in English, Spanish, and Portuguese.',
    sections: [
        {
            id: 'how-to-calculate-a-derivative',
            heading: 'How to calculate a derivative with this solver',
            paragraphs: [
                'A derivative is the instantaneous rate of change of a function. If f tells you a value at x, f′ tells you how fast that value is changing at x. On this page you type the function — x^2, sin(x), ln(x), or something longer — and press Solve. The calculator returns the derivative, names the rule it used, and lists the steps so you can check the work instead of copying a bare answer.',
                'Common functions are differentiated with deterministic calculus rules: power, constant, sum, product, quotient, and chain, plus the standard derivatives of sine, cosine, tangent, exponentials, and logarithms. An explanation in words sits next to those steps. You can change the expression and solve again without reloading the page.',
                'Write powers with ^, and put parentheses around anything that belongs together. sin(2*x) is unambiguous. sin2x is easy for both students and parsers to misread. Functions the solver recognizes include sin, cos, tan, sec, csc, cot, arcsin, arccos, arctan, ln, log, exp, and sqrt.',
            ],
        },
        {
            id: 'derivative-rules-the-solver-uses',
            heading: 'Derivative rules the solver uses',
            paragraphs: [
                'The power rule is the one you will use most: the derivative of x^n is n·x^(n−1). The derivative of x^2 is 2x. The derivative of x^3 is 3x^2. A constant has derivative 0, so the derivative of pi is 0 even though pi is written as a letter. The sum rule then says you may differentiate one term at a time: the derivative of x^2 + 1 is just 2x.',
                'The product rule is for a product of two functions, (uv)′ = u′v + uv′. The derivative of x·sin(x) is sin(x) + x·cos(x). The quotient rule is for a fraction, (u/v)′ = (u′v − uv′) / v^2. That is why the derivative of 1/x is −1/x^2. Rewrite 1/x^2 as x^(−2) and the power rule gives −2x^(−3), which is −2/x^3. Both routes have to agree; if they do not, a sign was dropped.',
                'The chain rule is for a function inside a function: the derivative of f(g(x)) is f′(g(x))·g′(x). The derivative of sin(2x) is cos(2x) times 2, which is 2 cos(2x). Skipping that inner 2 is the usual wrong answer.',
                'Trigonometric derivatives worth memorizing: the derivative of sin(x) is cos(x), of cos(x) is −sin(x), of tan(x) is sec^2(x), of cot(x) is −csc^2(x), of sec(x) is sec(x)tan(x), and of csc(x) is −csc(x)cot(x). Inverse trig is a different family. The derivative of arcsin(x) is 1/√(1−x^2), of arccos(x) is −1/√(1−x^2), and of arctan(x) is 1/(1+x^2). Searches for sin^−1(x) or tan^−1(x) mean these inverse functions, not 1/sin(x).',
                'Exponentials and logarithms: the derivative of e^x is e^x, of e^(2x) is 2e^(2x), of ln(x) is 1/x, and of ln(2x) is also 1/x because the constant factor 2 disappears into the chain rule. The derivative of x·ln(x) needs the product rule and equals ln(x) + 1.',
            ],
        },
        {
            id: 'mistakes-that-change-the-derivative',
            heading: 'Mistakes that change the derivative',
            paragraphs: [
                'Dropping the chain-rule factor. The derivative of sin(2x) is not cos(2x). The derivative of the inside, which is 2, has to multiply the outside derivative.',
                'Treating a product as a sum. The derivative of x·sin(x) is not cos(x). Each factor contributes a term, and both terms stay.',
                'Reading inverse trig as a reciprocal. arcsin(x) is not csc(x). The derivative of arcsin(x) is not the derivative of 1/sin(x). If a problem writes sin^−1(x), check whether the course means the inverse function. On these pages, arcsin means the inverse.',
                'Differentiating a constant that looks important. pi, numeric coefficients standing alone, and e^0 all have derivative 0. e^x does not, because the exponent still depends on x.',
                'Mixing up ln and log. Here ln(x) is the natural logarithm, base e, and its derivative is 1/x. If your class uses log for base 10, that derivative has an extra factor of 1/ln(10). Type the base you were given.',
            ],
        },
        {
            id: 'integrals-limits-and-other-tools',
            heading: 'Integrals, limits, and the other tools',
            paragraphs: [
                'Differentiation answers “how fast is this changing?” An integral asks for an antiderivative, and a limit asks what the function approaches. Those are separate calculators: the integral calculator, the limit calculator, the matrix calculator for determinants and inverses, and the differential-equation solver for first- and second-order equations. The calculus wiki states the rules above as short articles when you want the definition without running another calculation.',
                'If a result looks wrong, check parentheses and the variable first. The solver differentiates with respect to x. An expression with no x in it is a constant, and the derivative will be 0.',
            ],
        },
    ],
    examplesHeading: 'Worked derivatives students look up',
    examples: [
        { href: '/derivative-of-sin-2x', label: 'Derivative of sin(2x)', detail: 'Chain rule: cos(2x) · 2 = 2 cos(2x).' },
        { href: '/derivative-of-1-over-x-squared', label: 'Derivative of 1/x^2', detail: 'Rewrite as x^(−2). Power rule: −2/x^3.' },
        { href: '/derivative-of-tan-x', label: 'Derivative of tan(x)', detail: 'sec^2(x). The quotient rule on sin/cos gives the same result.' },
        { href: '/derivative-of-arcsin-x', label: 'Derivative of arcsin(x)', detail: '1/√(1−x^2), for x between −1 and 1.' },
        { href: '/derivative-of-cot-x', label: 'Derivative of cot(x)', detail: '−csc^2(x). The minus sign belongs in the answer.' },
        { href: '/derivative-of-2x', label: 'Derivative of 2x', detail: 'A straight line of slope 2. The derivative is the constant 2.' },
        { href: '/derivative-of-pi', label: 'Derivative of pi', detail: 'Pi does not depend on x, so the derivative is 0.' },
        { href: '/derivative-of-x-ln-x', label: 'Derivative of x ln(x)', detail: 'Product rule: ln(x) + 1.' },
    ],
    faqs: [
        {
            question: 'What is a derivative calculator?',
            answer: 'A derivative calculator differentiates a function you type and shows the resulting formula. This one also names the rule and lists the steps, so you can use it to check homework rather than only to copy a final expression.',
        },
        {
            question: 'How do I use the derivative solver?',
            answer: 'Enter a function of x, such as x^2, sin(2*x), or ln(x), and press Solve. Powers use the ^ symbol. Parentheses keep the chain rule and the quotient rule attached to the right part of the expression.',
        },
        {
            question: 'What is the derivative of sin(x)?',
            answer: 'The derivative of sin(x) is cos(x). The derivative of sin(2x) is not cos(2x); the chain rule multiplies by 2, so the answer is 2 cos(2x).',
        },
        {
            question: 'What is the derivative of 1/x^2?',
            answer: 'Rewrite 1/x^2 as x^(−2). The power rule gives −2 x^(−3), which is −2/x^3.',
        },
        {
            question: 'Does the calculator show steps for free?',
            answer: 'Yes. The step-by-step derivative, the integral calculator, and the limit calculator run without an account. You can solve again as many times as you need.',
        },
        {
            question: 'What is the derivative of a constant such as pi?',
            answer: 'The derivative of any constant is 0. Pi, 5, and e^0 are constants. e^x is not a constant, and its derivative is e^x.',
        },
    ],
};

const es: HomeGuide = {
    lede: 'Esta calculadora de derivadas resuelve la derivada, indica la regla que se usó y muestra los pasos. Es gratis, no pide cuenta, y la misma herramienta está en español, inglés y portugués.',
    sections: [
        {
            id: 'como-calcular-una-derivada',
            heading: 'Cómo calcular una derivada con este solver',
            paragraphs: [
                'La derivada mide cómo cambia una función en un punto. Si f da el valor en x, f′ da la rapidez de ese cambio. Escribe la función — x^2, sin(x), ln(x) o una expresión más larga — y pulsa Solve. Verás la derivada, el nombre de la regla y los pasos para comprobar el resultado antes de copiarlo.',
                'Las funciones habituales se derivan con reglas deterministas: potencia, constante, suma, producto, cociente y cadena, más las derivadas de seno, coseno, tangente, exponenciales y logaritmos. Al lado aparece una explicación en palabras. Puedes cambiar la expresión y resolver otra vez sin recargar la página.',
                'Las potencias se escriben con ^. Los paréntesis evitan ambigüedades: sin(2*x) se lee bien; sin2x se confunde con facilidad. El solver reconoce sin, cos, tan, sec, csc, cot, arcsin, arccos, arctan, ln, log, exp y sqrt.',
            ],
        },
        {
            id: 'reglas-de-derivacion',
            heading: 'Reglas de derivación que aplica el solver',
            paragraphs: [
                'La regla de la potencia es la más usada: la derivada de x^n es n·x^(n−1). La derivada de x^2 es 2x y la de x^3 es 3x^2. Una constante tiene derivada 0, así que la derivada de pi es 0. La regla de la suma permite derivar término a término: la derivada de x^2 + 1 es 2x.',
                'La regla del producto sirve cuando hay dos funciones multiplicadas: (uv)′ = u′v + uv′. La derivada de x·sin(x) es sin(x) + x·cos(x). La regla del cociente es (u/v)′ = (u′v − uv′) / v^2. Por eso la derivada de 1/x es −1/x^2. Si escribes 1/x^2 como x^(−2), la regla de la potencia da −2x^(−3), es decir −2/x^3.',
                'La regla de la cadena deriva una función dentro de otra: la derivada de f(g(x)) es f′(g(x))·g′(x). La derivada de sin(2x) es cos(2x) por 2, o sea 2 cos(2x). Olvidar ese 2 es el error más común en este ejercicio.',
                'Derivadas trigonométricas: sin(x) da cos(x), cos(x) da −sin(x), tan(x) da sec^2(x), cot(x) da −csc^2(x), sec(x) da sec(x)tan(x) y csc(x) da −csc(x)cot(x). La derivada de arcsin(x) es 1/√(1−x^2), la de arccos(x) es −1/√(1−x^2) y la de arctan(x) es 1/(1+x^2). sin^−1(x) y tan^−1(x) nombran esas inversas, no 1/sin(x).',
                'Exponenciales y logaritmos: la derivada de e^x es e^x, la de e^(2x) es 2e^(2x), la de ln(x) es 1/x y la de ln(2x) también es 1/x. La derivada de x·ln(x) usa la regla del producto y vale ln(x) + 1.',
            ],
        },
        {
            id: 'errores-que-cambian-la-derivada',
            heading: 'Errores que cambian la derivada',
            paragraphs: [
                'Quitar el factor de la regla de la cadena. La derivada de sin(2x) no es cos(2x). Hay que multiplicar por la derivada del interior, que es 2.',
                'Tratar un producto como si fuera una suma. La derivada de x·sin(x) no es cos(x). Cada factor aporta un término.',
                'Confundir la inversa trigonométrica con el recíproco. arcsin(x) no es csc(x). Si el enunciado dice sin^−1(x), comprueba si el curso pide la función inversa. En estas páginas arcsin es la inversa.',
                'Derivar una constante que parece importante. pi, un número suelto y e^0 tienen derivada 0. e^x no es constante, porque el exponente depende de x.',
                'Mezclar ln y log. Aquí ln(x) es el logaritmo natural y su derivada es 1/x. Si en tu clase log significa base 10, la derivada lleva el factor extra 1/ln(10).',
            ],
        },
        {
            id: 'integrales-limites-y-otras-herramientas',
            heading: 'Integrales, límites y las otras herramientas',
            paragraphs: [
                'La derivada responde cómo cambia la función. La integral pide una antiderivada y el límite pide a qué valor se acerca. Para eso están la calculadora de integrales, la calculadora de límites, la calculadora de matrices y el solucionador de ecuaciones diferenciales. La wiki de cálculo resume las reglas cuando quieres la definición sin lanzar otro cálculo.',
                'Si el resultado no cuadra, revisa primero los paréntesis y la variable. El solver deriva respecto de x. Una expresión sin x es una constante y su derivada será 0.',
            ],
        },
    ],
    examplesHeading: 'Derivadas que los estudiantes buscan',
    examples: [
        { href: '/es/derivative-of-sin-2x', label: 'Derivada de sin(2x)', detail: 'Regla de la cadena: cos(2x) · 2 = 2 cos(2x).' },
        { href: '/es/derivative-of-1-over-x-squared', label: 'Derivada de 1/x^2', detail: 'Se escribe como x^(−2). Regla de la potencia: −2/x^3.' },
        { href: '/es/derivative-of-tan-x', label: 'Derivada de tan(x)', detail: 'sec^2(x). El cociente sin/cos da el mismo resultado.' },
        { href: '/es/derivative-of-arcsin-x', label: 'Derivada de arcsin(x)', detail: '1/√(1−x^2), con x entre −1 y 1.' },
        { href: '/es/derivative-of-cot-x', label: 'Derivada de cot(x)', detail: '−csc^2(x). El signo menos forma parte de la respuesta.' },
        { href: '/es/derivative-of-2x', label: 'Derivada de 2x', detail: 'Recta de pendiente 2. La derivada es la constante 2.' },
        { href: '/es/derivative-of-pi', label: 'Derivada de pi', detail: 'Pi no depende de x, así que la derivada es 0.' },
        { href: '/es/derivative-of-x-ln-x', label: 'Derivada de x ln(x)', detail: 'Regla del producto: ln(x) + 1.' },
    ],
    faqs: [
        {
            question: '¿Qué es una calculadora de derivadas?',
            answer: 'Una calculadora de derivadas deriva la función que escribes y muestra la fórmula resultante. Esta además nombra la regla y lista los pasos, para revisar un ejercicio y no solo copiar el resultado.',
        },
        {
            question: '¿Cómo se usa el solver de derivadas?',
            answer: 'Escribe una función de x, por ejemplo x^2, sin(2*x) o ln(x), y pulsa Solve. Las potencias usan ^. Los paréntesis mantienen la regla de la cadena y la del cociente en la parte correcta.',
        },
        {
            question: '¿Cuál es la derivada de sin(x)?',
            answer: 'La derivada de sin(x) es cos(x). La derivada de sin(2x) no es cos(2x); la regla de la cadena multiplica por 2, así que el resultado es 2 cos(2x).',
        },
        {
            question: '¿Cuál es la derivada de 1/x^2?',
            answer: 'Escribe 1/x^2 como x^(−2). La regla de la potencia da −2 x^(−3), es decir −2/x^3.',
        },
        {
            question: '¿Los pasos son gratis?',
            answer: 'Sí. La derivada paso a paso, la calculadora de integrales y la calculadora de límites funcionan sin crear una cuenta.',
        },
        {
            question: '¿Cuál es la derivada de una constante como pi?',
            answer: 'La derivada de cualquier constante es 0. Pi, 5 y e^0 son constantes. e^x no lo es, y su derivada es e^x.',
        },
    ],
};

const pt: HomeGuide = {
    lede: 'Esta calculadora de derivadas entrega a derivada, a regra usada e os passos. É grátis, não pede conta, e a mesma ferramenta funciona em português, inglês e espanhol.',
    sections: [
        {
            id: 'como-calcular-uma-derivada',
            heading: 'Como calcular uma derivada com este solver',
            paragraphs: [
                'A derivada mede a taxa de variação instantânea de uma função. Se f dá o valor em x, f′ diz a rapidez dessa mudança. Digite a função — x^2, sin(x), ln(x) ou uma expressão maior — e pressione Solve. O resultado traz a derivada, o nome da regra e os passos para conferir a conta.',
                'As funções comuns são derivadas com regras determinísticas: potência, constante, soma, produto, quociente e cadeia, além das derivadas de seno, cosseno, tangente, exponenciais e logaritmos. Uma explicação em palavras fica ao lado dos passos. Dá para trocar a expressão e resolver de novo sem recarregar a página.',
                'Potências usam ^. Parênteses evitam leitura ambígua: sin(2*x) é claro; sin2x confunde. O solver reconhece sin, cos, tan, sec, csc, cot, arcsin, arccos, arctan, ln, log, exp e sqrt.',
            ],
        },
        {
            id: 'regras-de-derivacao',
            heading: 'Regras de derivação que o solver aplica',
            paragraphs: [
                'A regra da potência é a mais usada: a derivada de x^n é n·x^(n−1). A derivada de x^2 é 2x e a de x^3 é 3x^2. Constante tem derivada 0, então a derivada de pi é 0. A regra da soma deriva termo a termo: a derivada de x^2 + 1 é 2x.',
                'A regra do produto vale para duas funções multiplicadas: (uv)′ = u′v + uv′. A derivada de x·sin(x) é sin(x) + x·cos(x). A regra do quociente é (u/v)′ = (u′v − uv′) / v^2. Por isso a derivada de 1/x é −1/x^2. Escrevendo 1/x^2 como x^(−2), a regra da potência dá −2x^(−3), ou −2/x^3.',
                'A regra da cadeia deriva uma função dentro de outra: a derivada de f(g(x)) é f′(g(x))·g′(x). A derivada de sin(2x) é cos(2x) vezes 2, isto é 2 cos(2x). Esquecer esse 2 é o erro mais comum nesse exercício.',
                'Derivadas trigonométricas: sin(x) dá cos(x), cos(x) dá −sin(x), tan(x) dá sec^2(x), cot(x) dá −csc^2(x), sec(x) dá sec(x)tan(x) e csc(x) dá −csc(x)cot(x). A derivada de arcsin(x) é 1/√(1−x^2), a de arccos(x) é −1/√(1−x^2) e a de arctan(x) é 1/(1+x^2). sin^−1(x) e tan^−1(x) nomeiam essas inversas, não 1/sin(x).',
                'Exponenciais e logaritmos: a derivada de e^x é e^x, a de e^(2x) é 2e^(2x), a de ln(x) é 1/x e a de ln(2x) também é 1/x. A derivada de x·ln(x) usa a regra do produto e vale ln(x) + 1.',
            ],
        },
        {
            id: 'erros-que-mudam-a-derivada',
            heading: 'Erros que mudam a derivada',
            paragraphs: [
                'Tirar o fator da regra da cadeia. A derivada de sin(2x) não é cos(2x). É preciso multiplicar pela derivada do interior, que é 2.',
                'Tratar um produto como soma. A derivada de x·sin(x) não é cos(x). Cada fator gera um termo.',
                'Confundir inversa trigonométrica com recíproca. arcsin(x) não é csc(x). Se o enunciado diz sin^−1(x), confira se o curso pede a função inversa. Nestas páginas arcsin é a inversa.',
                'Derivar uma constante que parece importante. pi, um número solto e e^0 têm derivada 0. e^x não é constante, porque o expoente depende de x.',
                'Misturar ln e log. Aqui ln(x) é o logaritmo natural e a derivada é 1/x. Se na sua aula log significa base 10, a derivada leva o fator extra 1/ln(10).',
            ],
        },
        {
            id: 'integrais-limites-e-outras-ferramentas',
            heading: 'Integrais, limites e as outras ferramentas',
            paragraphs: [
                'A derivada responde como a função muda. A integral pede uma antiderivada e o limite pede o valor de que a função se aproxima. Para isso existem a calculadora de integrais, a calculadora de limites, a calculadora de matrizes e o resolvedor de equações diferenciais. A wiki de cálculo resume as regras quando você quer a definição sem disparar outro cálculo.',
                'Se o resultado não bater, confira primeiro os parênteses e a variável. O solver deriva em relação a x. Uma expressão sem x é constante e a derivada será 0.',
            ],
        },
    ],
    examplesHeading: 'Derivadas que os estudantes pesquisam',
    examples: [
        { href: '/pt/derivative-of-sin-2x', label: 'Derivada de sin(2x)', detail: 'Regra da cadeia: cos(2x) · 2 = 2 cos(2x).' },
        { href: '/pt/derivative-of-1-over-x-squared', label: 'Derivada de 1/x^2', detail: 'Escreva como x^(−2). Regra da potência: −2/x^3.' },
        { href: '/pt/derivative-of-tan-x', label: 'Derivada de tan(x)', detail: 'sec^2(x). O quociente sin/cos dá o mesmo resultado.' },
        { href: '/pt/derivative-of-arcsin-x', label: 'Derivada de arcsin(x)', detail: '1/√(1−x^2), com x entre −1 e 1.' },
        { href: '/pt/derivative-of-cot-x', label: 'Derivada de cot(x)', detail: '−csc^2(x). O sinal de menos faz parte da resposta.' },
        { href: '/pt/derivative-of-2x', label: 'Derivada de 2x', detail: 'Reta de inclinação 2. A derivada é a constante 2.' },
        { href: '/pt/derivative-of-pi', label: 'Derivada de pi', detail: 'Pi não depende de x, então a derivada é 0.' },
        { href: '/pt/derivative-of-x-ln-x', label: 'Derivada de x ln(x)', detail: 'Regra do produto: ln(x) + 1.' },
    ],
    faqs: [
        {
            question: 'O que é uma calculadora de derivadas?',
            answer: 'Uma calculadora de derivadas deriva a função que você digita e mostra a fórmula resultante. Esta também nomeia a regra e lista os passos, para conferir um exercício e não só copiar o resultado.',
        },
        {
            question: 'Como uso o solver de derivadas?',
            answer: 'Digite uma função de x, como x^2, sin(2*x) ou ln(x), e pressione Solve. Potências usam ^. Os parênteses mantêm a regra da cadeia e a do quociente na parte certa da expressão.',
        },
        {
            question: 'Qual é a derivada de sin(x)?',
            answer: 'A derivada de sin(x) é cos(x). A derivada de sin(2x) não é cos(2x); a regra da cadeia multiplica por 2, então a resposta é 2 cos(2x).',
        },
        {
            question: 'Qual é a derivada de 1/x^2?',
            answer: 'Escreva 1/x^2 como x^(−2). A regra da potência dá −2 x^(−3), isto é −2/x^3.',
        },
        {
            question: 'Os passos são grátis?',
            answer: 'Sim. A derivada passo a passo, a calculadora de integrais e a calculadora de limites funcionam sem criar uma conta.',
        },
        {
            question: 'Qual é a derivada de uma constante como pi?',
            answer: 'A derivada de qualquer constante é 0. Pi, 5 e e^0 são constantes. e^x não é constante, e a derivada é e^x.',
        },
    ],
};

export const homeGuide: Record<Locale, HomeGuide> = { en, es, pt };

export function visibleWordCount(guide: HomeGuide): number {
    const chunks = [
        guide.lede,
        guide.examplesHeading,
        ...guide.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
        ...guide.examples.flatMap((example) => [example.label, example.detail]),
        ...guide.faqs.flatMap((faq) => [faq.question, faq.answer]),
    ];
    return chunks.join(' ').split(/\s+/).filter(Boolean).length;
}
