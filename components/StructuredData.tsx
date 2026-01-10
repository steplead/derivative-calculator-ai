interface StructuredDataProps {
  data: Record<string, any>;
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Generates MathSolver structured data for calculator pages
 */
export function generateMathSolverData({
  name,
  description,
  url,
  educationalLevel = "College",
}: {
  name: string;
  description: string;
  url: string;
  educationalLevel?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MathSolver",
    name: name,
    description: description,
    url: url,
    educationalLevel: educationalLevel,
    teaches: ["Calculus", "Differentiation", "Integration"],
    learningResourceType: "Solver",
    provider: {
      "@type": "Organization",
      name: "Derivative Calculator AI",
      url: "https://derivativecalculatorai.com",
    },
  };
}

/**
 * Generates BreadcrumbList structured data
 */
export function generateBreadcrumbData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generates FAQPage structured data
 */
export function generateFAQData(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
