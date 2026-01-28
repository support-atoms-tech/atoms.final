'use client';

import dynamic from 'next/dynamic';

const FAQ = dynamic(() => import('./faq').then((mod) => ({ default: mod.FAQ })), {
    ssr: false,
    loading: () => (
        <section className="relative py-24 md:py-32 lg:py-40 bg-[#0f0f0f] text-white">
            <div className="container mx-auto px-4">
                <div className="animate-pulse">
                    <div className="h-16 bg-gray-800 rounded w-1/3 mb-8" />
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-800 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    ),
});

export function FAQWrapper() {
    return <FAQ />;
}
