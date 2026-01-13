import { headers } from 'next/headers';
import type { Metadata } from 'next';
import StructuredData from '@/components/StructuredData';

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
    const url = locale === 'en' ? `${siteUrl}/about` : `${siteUrl}/${locale}/about`;

    return {
        title: "About Us - Mission & Team | Derivative Calculator AI",
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
    // Generate Organization structured data for E-E-A-T
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Derivative Calculator AI",
        "url": "https://derivativecalculatorai.com",
        "logo": "https://derivativecalculatorai.com/og-image.webp",
        "description": "AI-powered mathematical toolkit for engineering and education",
        "sameAs": [
            "https://twitter.com/derivativecalc",
            "https://github.com/derivativecalculatorai"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "contact@derivativecalculatorai.com",
            "availableLanguage": ["English", "Spanish", "Portuguese"]
        }
    };

    return (
        <>
            <StructuredData data={organizationSchema} />
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
                                Born from the need for a more intuitive, reliable, and accessible mathematical toolkit, we&apos;ve built a platform that combines the rigid precision of symbolic math engines with the contextual intelligence of modern Large Language Models (LLMs).
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
                                Whether you&apos;re a university student tackling advanced multivariable calculus or a professional engineer optimizing a system, our &quot;Elite&quot; toolkit is designed to provide clarity where others provide confusion.
                            </p>

                            <p className="italic text-blue-600 dark:text-blue-400 pt-4">
                                &quot;We don&apos;t just solve problems; we solve for understanding.&quot;
                            </p>

                            {/* E-E-A-T: Author/Team Section */}
                            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Team</h2>

                                <div className="grid md:grid-cols-1 gap-6">
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                                                DC
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                    Development Team
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300 mb-3">
                                                    Our team consists of mathematics educators, software engineers, and AI researchers with advanced degrees in Applied Mathematics, Computer Science, and Engineering.
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                                        Applied Mathematics
                                                    </span>
                                                    <span className="px-3 py-1 text-xs font-medium bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-full">
                                                        Computer Science
                                                    </span>
                                                    <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                                                        AI/ML Research
                                                    </span>
                                                    <span className="px-3 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
                                                        Education Technology
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Why Trust Us?</h4>
                                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 dark:text-blue-400 mt-1">✓</span>
                                            <span><strong>Academic Rigor:</strong> All solutions verified against standard mathematical references and textbooks</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 dark:text-blue-400 mt-1">✓</span>
                                            <span><strong>Transparent Methodology:</strong> Step-by-step explanations show exactly how solutions are derived</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 dark:text-blue-400 mt-1">✓</span>
                                            <span><strong>Continuous Improvement:</strong> Regularly updated with feedback from educators and students</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 dark:text-blue-400 mt-1">✓</span>
                                            <span><strong>Privacy First:</strong> No data collection or tracking. Your calculations stay private.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Contact Section for Trust */}
                            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-600 text-white">
                                <h3 className="text-2xl font-bold mb-3">Get in Touch</h3>
                                <p className="text-blue-50 mb-4">
                                    Have questions, suggestions, or feedback? We&apos;d love to hear from you.
                                </p>
                                <a
                                    href="mailto:contact@derivativecalculatorai.com"
                                    className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    Contact Us
                                </a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
