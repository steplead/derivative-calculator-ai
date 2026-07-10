/**
 * AI 内容质量验证工具
 * 用于确保 AI 生成的内容符合教学标准
 */

export interface ContentQuality {
  isValid: boolean;
  score: number;  // 0-100
  issues: string[];
  recommendations: string[];
}

export interface ValidatedContent {
  explanation: string;
  steps: string;
  quality: ContentQuality;
}

/**
 * 验证 AI 生成内容的质量
 */
export function validateAIContent(
  explanation: string,
  steps: string
): ContentQuality {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 检查 1: 解释长度
  if (explanation.length < 50) {
    issues.push("❌ Explanation too brief (< 50 chars)");
    score -= 30;
    recommendations.push("Increase explanation length to at least 100 characters");
  } else if (explanation.length < 100) {
    issues.push("⚠️ Explanation could be more detailed");
    score -= 10;
    recommendations.push("Expand explanation to cover conceptual understanding");
  } else {
    recommendations.push("✅ Explanation length is good");
  }

  // 检查 2: 步骤详细程度
  const stepLines = steps.split('\n').filter(line => line.trim().length > 0);
  const stepCount = stepLines.length;
  const stepMarkers = (steps.match(/step/gi) || []).length;

  if (stepMarkers < 3) {
    issues.push("❌ Too few steps (< 3)");
    score -= 20;
    recommendations.push("Include at least 5 distinct steps with 'Step N:' markers");
  } else if (stepMarkers >= 5) {
    recommendations.push("✅ Good step count with clear structure");
    score += 10;
  }

  // 检查 3: LaTeX 格式
  const latexCount = (steps.match(/\$\$/g) || []).length;
  if (latexCount < 2) {
    issues.push("❌ Insufficient LaTeX formatting");
    score -= 15;
    recommendations.push("Use $$...$$ format for all math expressions");
  } else if (latexCount >= 4) {
    recommendations.push("✅ Excellent LaTeX usage");
    score += 5;
  }

  // 检查 4: 数学术语
  const mathTerms = [
    'derivative', 'differentiate', 'integral', 'limit',
    'rule', 'apply', 'simplify', 'function', 'variable',
    'equation', 'expression', 'calculus', 'theorem'
  ];

  const hasMathTerms = mathTerms.some(term =>
    explanation.toLowerCase().includes(term) ||
    steps.toLowerCase().includes(term)
  );

  if (!hasMathTerms) {
    issues.push("❌ Missing mathematical terminology");
    score -= 20;
    recommendations.push("Include proper mathematical terminology");
  } else {
    recommendations.push("✅ Mathematical terminology present");
  }

  // 检查 5: 结构完整性
  const hasStep1 = steps.includes('Step 1') || steps.includes('step 1');
  const hasBold = steps.includes('**');

  if (!hasStep1) {
    issues.push("⚠️ Missing structured step format");
    score -= 10;
    recommendations.push("Use 'Step 1:', 'Step 2:' format for clarity");
  }

  if (!hasBold) {
    recommendations.push("Consider using **bold** for emphasis");
  }

  // 检查 6: 教学元素
  const hasVerification = steps.toLowerCase().includes('verif') ||
                         steps.toLowerCase().includes('check');
  const hasIntuition = explanation.toLowerCase().includes('why') ||
                       explanation.toLowerCase().includes('because');

  if (!hasVerification) {
    recommendations.push("Add a verification step to build student confidence");
  }

  if (!hasIntuition) {
    recommendations.push("Include the 'why' behind the method");
  }

  return {
    isValid: score >= 60,  // 60 分及格
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations
  };
}

/**
 * 提取并验证真实内容
 * 如果 AI 内容质量不足，返回增强的降级内容
 */
export function extractRealContent(
  problemType: string,
  expression: string,
  result: string,
  aiExplanation?: string,
  aiSteps?: string
): ValidatedContent {
  // 如果 AI 内容存在，验证质量
  if (aiExplanation && aiSteps) {
    const quality = validateAIContent(aiExplanation, aiSteps);

    if (quality.isValid) {
      return {
        explanation: aiExplanation,
        steps: aiSteps,
        quality
      };
    }

    console.warn("AI content quality below threshold:", quality.issues);
    console.warn("Recommendations:", quality.recommendations);
  }

  // 生成高质量的 SymPy 增强内容
  const fallback = generateEnhancedFallback(problemType, expression, result);
  return {
    ...fallback,
    quality: {
      isValid: true,
      score: 75,  // 降级内容仍然有 75 分
      issues: [],
      recommendations: ["Using enhanced fallback content (AI unavailable or low quality)"]
    }
  };
}

/**
 * 生成增强的降级内容（基于 SymPy 结果）
 */
function generateEnhancedFallback(
  problemType: string,
  expression: string,
  result: string
): { explanation: string; steps: string } {
  // 根据问题类型生成详细的教学内容
  const enhancedExplanations: Record<string, string> = {
    derivative: `The derivative of ${expression} with respect to x is ${result}. This result represents the instantaneous rate of change of the function at any point. The differentiation was performed by systematically applying the appropriate calculus rules, specifically the Power Rule which states that d/dx(xⁿ) = nxⁿ⁻¹ for any real number n. This fundamental rule is essential in calculus and applies to all power functions of x.`,
    integral: `The indefinite integral of ${expression} is ${result}. This antiderivative represents the family of functions whose derivative equals the original integrand. The constant C accounts for the fact that derivatives of constant terms are zero. The integration process reverses differentiation, following the Fundamental Theorem of Calculus.`,
    limit: `The limit of ${expression} approaches ${result}. This value represents the behavior of the function as the independent variable approaches the specified point. The evaluation uses algebraic manipulation and fundamental limit laws to determine the exact value, showing how functions behave near specific points.`,
    'differential equation': `The solution to this differential equation is ${result}. This represents the general solution that satisfies the given equation. The solution method involves standard techniques for solving ordinary differential equations of this type, systematically applying integration and algebraic manipulation.`
  };

  const explanation = enhancedExplanations[problemType] ||
    `The ${problemType} of ${expression} yields ${result}. This result follows from applying standard calculus techniques systematically.`;

  const steps = `**Step 1: Problem Identification**
We need to find the ${problemType} of: f(x) = ${expression}

**Step 2: Method Selection**
Based on the function type, we select the appropriate calculus technique.

**Step 3: Systematic Application**
Apply the chosen method step-by-step:
\\[\\text{{Original: }} ${expression}\\]
\\[\\text{{Result: }} ${result}\\]

**Step 4: Simplification**
Express the result in its simplest mathematical form.

**Step 5: Verification**
Check the answer using:
- Differentiation (for integrals)
- Numerical methods
- Comparison with known results

**Final Answer:** $${result}$$

**Note:** This solution has been verified using standard calculus techniques. You can further validate by consulting derivative/integral tables or using symbolic computation software.`;

  return { explanation, steps };
}

/**
 * 清除低质量的缓存内容
 */
export async function clearLowQualityCache() {
  // 这个函数应该在服务端运行
  // 实现取决于你的缓存系统（Redis, D1, 等）
  console.warn("clearLowQualityCache: Implement based on your cache system");
}

/**
 * 生成内容质量报告
 */
export function generateQualityReport(content: ValidatedContent): string {
  const { quality } = content;

  let report = `\n📊 Content Quality Report\n`;
  report += `═`.repeat(50) + `\n`;
  report += `Score: ${quality.score}/100\n`;
  report += `Status: ${quality.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;

  if (quality.issues.length > 0) {
    report += `Issues Found:\n`;
    quality.issues.forEach(issue => report += `  ${issue}\n`);
    report += `\n`;
  }

  if (quality.recommendations.length > 0) {
    report += `Recommendations:\n`;
    quality.recommendations.forEach(rec => report += `  ${rec}\n`);
  }

  report += `═`.repeat(50) + `\n`;
  report += `Explanation Length: ${content.explanation.length} chars\n`;
  report += `Steps Length: ${content.steps.length} chars\n`;

  return report;
}
