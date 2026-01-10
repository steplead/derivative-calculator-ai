import StructuredData from './StructuredData';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export default function FAQ({ items }: FAQProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <>
      <StructuredData data={faqSchema} />
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <details key={index} className="group bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-gray-900 dark:text-white">
                {item.question}
                <span className="ml-2 transition group-open:rotate-180">▼</span>
              </summary>
              <div className="px-4 pb-4 text-gray-600 dark:text-gray-400">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
