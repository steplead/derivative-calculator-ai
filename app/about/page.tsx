import { headers } from 'next/headers';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
    const url = locale === 'en' ? `${siteUrl}/about` : `${siteUrl}/${locale}/about`;

    return {
        title: "About Us | Derivative Calculator AI",
        description: "Learn more about the mission and technology behind the world's most advanced AI-first mathematical toolkit.",
        alternates: {
            canonical: url,
            languages: {
                'en': `${siteUrl}/about`,
                'es': `${siteUrl}/es/about`,
                'pt': `${siteUrl}/pt/about`,
            }
        }
    };
}

export default function AboutPage() {
    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <main className="container mx-auto max-w-4xl mt-10">
                <div className="glass-panel p-8 md:p-12 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-white/5">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 mb-8">
                        Empowering the Next Generation of Engineers
                    </h1>

                    <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                        <p>
                            At <span className="text-gray-900 dark:text-white font-semibold">Derivative Calculator AI</span>, our mission is to redefine how students and engineers interact with complex mathematics. We believe that a solution is only as good as the understanding it provides.
                        </p>

                        <p>
                            Born from the need for a more intuitive, reliable, and accessible mathematical toolkit, we've built a platform that combines the rigid precision of symbolic math engines with the contextual intelligence of modern Large Language Models (LLMs).
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 my-12">
                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-blue-500/30 transition-colors">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Symbolic Precision</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Our core engine uses advanced calculus algorithms to ensure 100% accurate results for complex derivatives, integrals, and matrix operations.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-teal-500/30 transition-colors">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI Context</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Powered by the latest DeepSeek reasoning models, we provide high-fidelity, step-by-step explanations that make learning intuitive.</p>
                            </div>
                        </div>

                        <p>
                            Whether you're a university student tackling advanced multivariable calculus or a professional engineer optimizing a system, our "Elite" toolkit is designed to provide clarity where others provide confusion.
                        </p>

                        <p className="italic text-blue-600 dark:text-blue-400 pt-4">
                            "We don't just solve problems; we solve for understanding."
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
