'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

const faqs = [
    {
        question: 'How does it work?',
        answer: 'We use Model Context Protocol (MCP), an open standard that lets AI assistants securely access your Polarion data.',
    },
    {
        question: 'What can it do?',
        answer: 'Find requirements, analyze contradictions, check against regulations, generate test cases, trace coverage gaps, compare across projects, and generate code that understands your full system context - not siloed coding from copy-pasted snippets.',
    },
    {
        question: 'Why AI coding tools vs a Polarion AI Assistant?',
        answer: "AI coding tools are powerful and already have over 50% adoption by software developers. It's a familiar interface for engineers.",
    },
    {
        question: 'Which AI tools does it work with?',
        answer: 'Claude Desktop, GitHub Copilot, Cursor, and any MCP-compatible AI assistant.',
    },
    {
        question: "I don't code - can I still use this?",
        answer: 'Yes. AI IDEs are used by non-coders too. You can chat with your requirements just like you would in ChatGPT.',
    },
    {
        question: 'Does it work with Cloud and On-Premise?',
        answer: 'Yes.',
    },
    {
        question:
            'Security is a big concern for us. How do we ensure there is never a data leak?',
        answer: 'We have multiple deployment options, including hosting inside your local environment to ensure your data stays within your network.',
    },
    {
        question: 'Do you train on any of our data?',
        answer: 'No.',
    },
    {
        question: 'Does it modify my Polarion data?',
        answer: 'No, read-only.',
    },
    {
        question: 'Is this an official Siemens product?',
        answer: 'No, this is developed by ATOMS, an independent company. We are in the process of becoming an official Siemens technology partner.',
    },
    {
        question: 'How much does it cost?',
        answer: 'Contact us for pricing.',
    },
    {
        question: 'Can we try before we commit as an organization?',
        answer: 'Yes. We have a web-based demo where you can add and modify requirements in our Polarion instance and chat with them in AI - completely outside your environment. You can get started in under 10 minutes.',
    },
    {
        question: 'How do I get started?',
        answer: 'Email hello@atoms.tech to request access.',
    },
];

function FAQItem({
    question,
    answer,
    isFirst,
}: {
    question: string;
    answer: string;
    isFirst: boolean;
}) {
    const [open, setOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const innerContentRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number>(0);

    // Measure content height using a hidden duplicate
    useEffect(() => {
        if (measureRef.current) {
            const measuredHeight = measureRef.current.scrollHeight;
            setHeight(measuredHeight);
        }
    }, [answer]);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className={`border-[#7F00FF]/20 ${isFirst ? 'border-t-0' : 'border-t'}`}>
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="group flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-[#7F00FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7F00FF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]"
                    >
                        <span className="text-base font-semibold text-white transition-colors group-hover:text-[#7F00FF] md:text-lg">
                            {question}
                        </span>
                        <span
                            className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center transition-colors ${open ? 'text-[#7F00FF]' : 'text-white'}`}
                        >
                            <motion.div
                                animate={{ rotate: open ? 180 : 0 }}
                                transition={{
                                    duration: 0.3,
                                    ease: [0.4, 0.0, 0.2, 1],
                                }}
                            >
                                <ChevronDown className="h-5 w-5" />
                            </motion.div>
                        </span>
                    </button>
                </CollapsibleTrigger>
                {/* Hidden element to measure height */}
                <div
                    ref={measureRef}
                    className="invisible absolute pointer-events-none"
                    style={{
                        visibility: 'hidden',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                >
                    <div className="pb-4">
                        <p className="text-sm leading-relaxed text-[#B5B5B5] md:text-base">
                            {answer}
                        </p>
                    </div>
                </div>
                <CollapsibleContent forceMount asChild>
                    <motion.div
                        ref={contentRef}
                        initial={false}
                        animate={{
                            height: open ? height : 0,
                            opacity: open ? 1 : 0,
                        }}
                        transition={{
                            duration: 0.4,
                            ease: [0.4, 0.0, 0.2, 1],
                        }}
                        style={{ overflow: 'hidden' }}
                        className="overflow-hidden"
                    >
                        <div ref={innerContentRef} className="pb-4">
                            <p className="text-sm leading-relaxed text-[#B5B5B5] md:text-base">
                                {answer}
                            </p>
                        </div>
                    </motion.div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

export function FAQ() {
    const titleRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [xOffset, setXOffset] = useState(0);
    const [blurAmount, setBlurAmount] = useState(0);
    const [showAll, setShowAll] = useState(false);
    const lastScrollY = useRef(0);

    const initialFaqs = faqs.slice(0, 8);
    const remainingFaqs = faqs.slice(8);

    // Smooth scroll-based horizontal movement synchronized with text top touching navbar bottom
    useEffect(() => {
        if (typeof window === 'undefined') return;

        lastScrollY.current = window.scrollY;

        const handleScroll = () => {
            if (!titleRef.current) return;

            // Get navbar element and its bottom position (the white line)
            const navbar =
                document.querySelector('nav') ||
                document.querySelector('[role="navigation"]');
            const navbarRect = navbar ? navbar.getBoundingClientRect() : null;
            const navbarBottom = navbarRect ? navbarRect.bottom : 70;

            // Get text position
            const textRect = titleRef.current.getBoundingClientRect();
            const textTop = textRect.top;
            const textLeftPosition = textRect.left;
            const viewportHeight = window.innerHeight;
            const threshold = viewportHeight * 0.5; // 50% of screen

            // Only start animation when text reaches 50% of screen
            const hasReachedThreshold = textTop <= threshold;

            if (hasReachedThreshold) {
                // Calculate when text top will meet navbar bottom
                // When textTop equals navbarBottom, progress should be 1
                const distanceToNavbar = textTop - navbarBottom;

                // Calculate the starting point (when animation begins at 50% threshold)
                const startDistance = threshold - navbarBottom;

                // Progress: 0 at start (50% threshold), 1 when textTop = navbarBottom
                const progress = Math.max(
                    0,
                    Math.min(1, 1 - distanceToNavbar / startDistance),
                );

                // Linear progress for consistent speed matching scroll position
                // Text should reach left edge exactly when textTop touches navbarBottom
                // Works for both scrolling up and down - smoothly reverses
                setXOffset(-textLeftPosition * progress);

                // Calculate blur based on overlap with FAQ container
                if (containerRef.current) {
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const textBottom = textRect.bottom;
                    const containerTop = containerRect.top;

                    // Check if text overlaps with container
                    if (textBottom > containerTop && textTop < containerTop) {
                        // Calculate overlap amount
                        const overlap = textBottom - containerTop;
                        const textHeight = textRect.height;
                        const overlapRatio = Math.min(overlap / textHeight, 1);

                        // Maximum blur when fully overlapped
                        const maxBlur = 12;
                        // Initial blur should be 60% of max when overlap first starts
                        const initialBlurPercent = 0.6;
                        const initialBlur = maxBlur * initialBlurPercent;

                        // Calculate blur based on overlap, starting from 60%
                        // When overlapRatio is 0 (just starting), use initialBlur
                        // When overlapRatio is 1 (fully overlapped), use maxBlur
                        const blurBasedOnOverlap =
                            initialBlur + (maxBlur - initialBlur) * overlapRatio;

                        // Reduce blur as sliding progresses (progress goes from 0 to 1)
                        // Keep more blur initially, reduce faster as sliding progresses
                        const blurReduction = Math.pow(1 - progress, 1.5);
                        const finalBlur = blurBasedOnOverlap * blurReduction;
                        setBlurAmount(finalBlur);
                    } else if (textBottom > containerTop && textTop >= containerTop) {
                        // Text is fully below container - no blur needed
                        setBlurAmount(0);
                    } else {
                        // No overlap or text is above container
                        setBlurAmount(0);
                    }
                } else {
                    setBlurAmount(0);
                }
            } else {
                // Before reaching 50%: return to original position
                setXOffset(0);
                setBlurAmount(0);
            }

            lastScrollY.current = window.scrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section className="relative py-24 md:py-32 lg:py-40 bg-[#0f0f0f] text-white">
            <div className="absolute top-0 left-0 w-full h-px bg-[#7F00FF]/30" />
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
                    {/* Left: Section title */}
                    <div ref={titleRef} className="lg:col-span-4 lg:-ml-4">
                        <motion.h2
                            style={{
                                x: xOffset,
                                y: '25%',
                                filter: `blur(${blurAmount}px)`,
                            }}
                            transition={{
                                type: 'tween',
                                duration: 0.1,
                                ease: 'linear',
                            }}
                            className="text-[32px] xs:text-[40px] sm:text-[48px] md:text-[60px] lg:text-[76px] xl:text-[92px] 2xl:text-[104px] font-black tracking-tighter text-white leading-none text-left w-full"
                        >
                            FREQUENTLY ASKED QUESTIONS.
                        </motion.h2>
                    </div>

                    {/* Right: Accordion */}
                    <div className="lg:col-span-8 lg:ml-24">
                        <div
                            ref={containerRef}
                            className="relative bg-[#0f0f0f] px-4 py-2 md:px-8"
                        >
                            {/* L-shaped corner brackets */}
                            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#7F00FF] z-20" />
                            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#7F00FF] z-20" />
                            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#7F00FF] z-20" />
                            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#7F00FF] z-20" />
                            {/* Connecting lines between corners */}
                            <div className="absolute top-3 left-9 right-9 h-px bg-[#7F00FF]/30 z-20" />
                            <div className="absolute bottom-3 left-9 right-9 h-px bg-[#7F00FF]/30 z-20" />
                            <div className="absolute left-3 top-9 bottom-9 w-px bg-[#7F00FF]/30 z-20" />
                            <div className="absolute right-3 top-9 bottom-9 w-px bg-[#7F00FF]/30 z-20" />
                            {initialFaqs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                    }}
                                >
                                    <FAQItem
                                        question={faq.question}
                                        answer={faq.answer}
                                        isFirst={index === 0}
                                    />
                                </motion.div>
                            ))}
                            <AnimatePresence>
                                {showAll && remainingFaqs.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{
                                            duration: 0.4,
                                            ease: [0.4, 0.0, 0.2, 1],
                                        }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        {remainingFaqs.map((faq, index) => (
                                            <motion.div
                                                key={index + 6}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: index * 0.05,
                                                }}
                                            >
                                                <FAQItem
                                                    question={faq.question}
                                                    answer={faq.answer}
                                                    isFirst={false}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {remainingFaqs.length > 0 && (
                            <>
                                {/* Toggle below bordered container */}
                                <div className="flex justify-center py-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAll(!showAll)}
                                        className="group inline-flex items-center gap-2 text-white transition-colors hover:text-[#7F00FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7F00FF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]"
                                    >
                                        <span className="text-sm font-medium text-[#B5B5B5] transition-colors group-hover:text-[#7F00FF]">
                                            {showAll ? 'Collapse FAQs' : 'Show all FAQs'}
                                        </span>
                                        <motion.span
                                            animate={{ rotate: showAll ? 180 : 0 }}
                                            transition={{
                                                duration: 0.25,
                                                ease: [0.4, 0.0, 0.2, 1],
                                            }}
                                            className="flex items-center justify-center text-[#7F00FF] transition-colors group-hover:text-[#7F00FF]"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </motion.span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-[#7F00FF]/30" />
        </section>
    );
}
