'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show button when page is scrolled down 300px
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/30 text-white hover:bg-[#9B51E0]/30 hover:border-[#9B51E0]/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="w-6 h-6 stroke-[2.5]" />
                </button>
            )}
        </>
    );
}
