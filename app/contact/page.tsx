import { Mail, Globe, Shield } from "lucide-react";

export const metadata = {
    title: "Contact Support | Derivative Calculator AI",
    description: "Get in touch with our engineering team for support, partnership inquiries, or feedback on our mathematical toolkit.",
};

export default function ContactPage() {
    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <main className="container mx-auto max-w-4xl mt-10">
                <div className="glass-panel p-8 md:p-12 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl text-center bg-white dark:bg-white/5">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 mb-6 transition-all">
                        Get in Touch
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
                        Have a question about a complex calculation? Found a bug? Our team is standing by to help.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:scale-105 transition-transform">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-bold mb-2 text-lg">Email Support</h3>
                            <p className="text-sm text-blue-500 dark:text-gray-400 break-all px-2">support@derivativecalculatorai.com</p>
                        </div>

                        <div className="p-8 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:scale-105 transition-transform">
                            <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-bold mb-2 text-lg">Partnerships</h3>
                            <p className="text-sm text-teal-500 dark:text-gray-400 break-all px-2">hello@derivativecalculatorai.com</p>
                        </div>

                        <div className="p-8 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:scale-105 transition-transform">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400">
                                <Globe size={24} />
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-bold mb-2 text-lg">Office</h3>
                            <p className="text-sm text-purple-500 dark:text-gray-400">Global AI-Math Labs</p>
                        </div>
                    </div>

                    <div className="mt-16 p-8 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-blue-700 dark:text-blue-200">
                            For security reasons, we do not store any personal data during your calculations.
                            Our contact lines are strictly for support and feedback.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
