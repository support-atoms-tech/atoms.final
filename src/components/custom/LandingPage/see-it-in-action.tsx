'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { BlurText } from '@/components/ui/blur-text';

const demoVideos = [
    {
        id: 1,
        src: '/demo1_steering_edited.mp4',
        title: 'Smart Requirements Steering',
        description: 'AI-powered requirement navigation and management',
    },
    {
        id: 2,
        src: '/Demo2 Edited.mp4',
        title: 'Intelligent Analysis',
        description: 'Deep insights into your requirements documentation',
    },
    {
        id: 3,
        src: '/demo3_contradiction_edited.mp4',
        title: 'Contradiction Detection',
        description: 'Automatically identify conflicting requirements',
    },
    {
        id: 4,
        src: '/demo4_regulation+incose_edit.mp4',
        title: 'Regulatory Compliance',
        description: 'INCOSE and regulatory standard validation',
    },
    {
        id: 5,
        src: '/Demo5_edit.mp4',
        title: 'Advanced Features',
        description: 'Powerful tools for complex requirements',
    },
    {
        id: 6,
        src: '/demo6_export_pdf_excel_eidt.mp4',
        title: 'Export & Integration',
        description: 'Seamless PDF and Excel export capabilities',
    },
    {
        id: 7,
        src: '/demo7_edit_code.mp4',
        title: 'Code Generation',
        description: 'Generate code directly from requirements',
    },
];

function VideoCard({
    src,
    title,
    description,
    index,
}: {
    src: string;
    title: string;
    description: string;
    index: number;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [blurAmount, setBlurAmount] = useState(0);

    useEffect(() => {
        const video = videoRef.current;
        const card = cardRef.current;
        if (!video || !card) return;

        const tryPlay = () => {
            const p = video.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {});
            }
            setIsPlaying(true);
        };

        const tryPause = () => {
            video.pause();
            setIsPlaying(false);
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Only play when card is at least 60% visible
                if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                    tryPlay();
                } else {
                    tryPause();
                }
            },
            {
                threshold: [0, 0.3, 0.6, 0.9, 1],
                rootMargin: '0px',
            },
        );

        observer.observe(card);
        return () => observer.disconnect();
    }, []);

    // Calculate blur based on scroll position
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleScroll = () => {
            const rect = card.getBoundingClientRect();
            const cardTop = rect.top;
            const cardHeight = rect.height;

            // If card is scrolling up and out of view (top of card is above viewport)
            if (cardTop < 0) {
                const scrollProgress = Math.abs(cardTop) / cardHeight;

                // Start blurring immediately as card begins scrolling up (0% to 100%)
                // This creates the most natural, gradual blur effect

                // Apply smooth easeInOut curve for natural-looking blur
                const easedProgress =
                    scrollProgress < 0.5
                        ? 2 * scrollProgress * scrollProgress
                        : 1 - Math.pow(-2 * scrollProgress + 2, 2) / 2;

                const blur = Math.min(easedProgress * 8, 8);
                setBlurAmount(blur);
            } else {
                // Card is in normal view, no blur
                setBlurAmount(0);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial calculation

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ['start end', 'end start'],
    });

    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

    return (
        <motion.div
            ref={cardRef}
            style={{
                scale,
                position: 'sticky',
                top: `${15 + index * 2}vh`,
                filter: `blur(${blurAmount}px)`,
                transition: 'filter 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
            className="scroll-snap-card w-full mb-8"
        >
            <div
                className={`relative bg-[#0f0f0f] backdrop-blur-sm overflow-hidden shadow-2xl group h-full transition-all duration-300 border border-[#7F00FF]/10 p-4`}
            >
                <div className="relative w-full h-full">
                    <video
                        ref={videoRef}
                        src={src}
                        className="w-full h-full object-contain"
                        muted
                        loop
                        playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 text-white z-10">
                        <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-300/90">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Border styling matching industry cards */}
                <div
                    className={`absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 transition-all duration-300 z-20 ${isPlaying ? 'border-[#7F00FF]' : 'border-[#7F00FF]/50'}`}
                />
                <div
                    className={`absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 transition-all duration-300 z-20 ${isPlaying ? 'border-[#7F00FF]' : 'border-[#7F00FF]/50'}`}
                />
                <div
                    className={`absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 transition-all duration-300 z-20 ${isPlaying ? 'border-[#7F00FF]' : 'border-[#7F00FF]/50'}`}
                />
                <div
                    className={`absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 transition-all duration-300 z-20 ${isPlaying ? 'border-[#7F00FF]' : 'border-[#7F00FF]/50'}`}
                />
                <div
                    className={`absolute top-3 left-9 right-9 h-px transition-all duration-300 z-20 ${isPlaying ? 'bg-[#7F00FF]/30' : 'bg-[#7F00FF]/20'}`}
                />
                <div
                    className={`absolute bottom-3 left-9 right-9 h-px transition-all duration-300 z-20 ${isPlaying ? 'bg-[#7F00FF]/30' : 'bg-[#7F00FF]/20'}`}
                />
                <div
                    className={`absolute left-3 top-9 bottom-9 w-px transition-all duration-300 z-20 ${isPlaying ? 'bg-[#7F00FF]/30' : 'bg-[#7F00FF]/20'}`}
                />
                <div
                    className={`absolute right-3 top-9 bottom-9 w-px transition-all duration-300 z-20 ${isPlaying ? 'bg-[#7F00FF]/30' : 'bg-[#7F00FF]/20'}`}
                />
            </div>
        </motion.div>
    );
}

export function SeeItInAction() {
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLHeadingElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isScrollingRef = useRef(false);
    const lastScrollY = useRef(0);
    const userIntentionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [headerScale, setHeaderScale] = useState(1);
    const [headerBlur, setHeaderBlur] = useState(0);

    useEffect(() => {
        let hasScrolledSignificantly = false;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY.current;

            // Detect scroll direction
            if (Math.abs(scrollDelta) > 5) {
                // Only count significant scrolls
                hasScrolledSignificantly = true;
            }

            lastScrollY.current = currentScrollY;
            isScrollingRef.current = true;

            // Update header scale and blur based on scroll
            updateHeaderTransform();

            // Clear existing timeouts
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            if (userIntentionTimeoutRef.current) {
                clearTimeout(userIntentionTimeoutRef.current);
            }

            // Immediate stop detection (user is holding position)
            scrollTimeoutRef.current = setTimeout(() => {
                isScrollingRef.current = false;
            }, 50);

            // Only snap if user has actually scrolled and then stopped
            userIntentionTimeoutRef.current = setTimeout(() => {
                if (hasScrolledSignificantly) {
                    snapToNearestCard();
                    hasScrolledSignificantly = false;
                }
            }, 200); // Wait 200ms after user stops scrolling
        };

        const updateHeaderTransform = () => {
            const header = headerRef.current;
            if (!header) return;

            const rect = header.getBoundingClientRect();
            const headerBottom = rect.bottom;
            const windowHeight = window.innerHeight;

            // Calculate how far the header has scrolled up
            if (rect.top < windowHeight * 0.3) {
                // Header is leaving the view
                const scrollProgress = Math.max(
                    0,
                    1 - headerBottom / (windowHeight * 0.5),
                );

                // Scale down from 1 to 0.7 as it scrolls up
                const scale = Math.max(0.7, 1 - scrollProgress * 0.3);
                setHeaderScale(scale);

                // Apply blur from 0 to 4px
                const blur = Math.min(scrollProgress * 4, 4);
                setHeaderBlur(blur);
            } else {
                // Header is in view, normal state
                setHeaderScale(1);
                setHeaderBlur(0);
            }
        };

        const snapToNearestCard = () => {
            const viewportCenter = window.innerHeight / 2;
            let closestCard: HTMLDivElement | null = null;
            let closestDistance = Infinity;

            cardsRef.current.forEach((card) => {
                if (!card) return;
                const rect = card.getBoundingClientRect();
                const cardCenter = rect.top + rect.height / 2;
                const distance = Math.abs(cardCenter - viewportCenter);

                if (
                    distance < closestDistance &&
                    rect.top < viewportCenter &&
                    rect.bottom > viewportCenter
                ) {
                    closestDistance = distance;
                    closestCard = card;
                }
            });

            // Only snap if the card is noticeably off-center (more than 100px)
            if (closestCard && closestDistance > 100) {
                const rect = (closestCard as HTMLDivElement).getBoundingClientRect();
                const cardCenter = rect.top + rect.height / 2;
                const offset = cardCenter - viewportCenter;

                window.scrollBy({
                    top: offset,
                    behavior: 'smooth',
                });
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            if (userIntentionTimeoutRef.current) {
                clearTimeout(userIntentionTimeoutRef.current);
            }
        };
    }, []);

    return (
        <section className="relative py-12 md:py-16 bg-[#0f0f0f] scroll-smooth">
            <div className="max-w-[1800px] mx-auto px-4 md:px-8">
                {/* Section Header with scroll-based transform + BlurText */}
                <div
                    ref={headerRef}
                    style={{
                        transform: `scale(${headerScale})`,
                        filter: `blur(${headerBlur}px)`,
                        transition: 'transform 0.3s ease-out, filter 0.3s ease-out',
                    }}
                    className="mb-12 md:mb-16 origin-center"
                >
                    <BlurText
                        text="SEE IT IN ACTION"
                        as="h2"
                        delay={150}
                        animateBy="words"
                        direction="top"
                        stepDuration={0.4}
                        className="text-[32px] xs:text-[40px] sm:text-[48px] md:text-[60px] lg:text-[76px] xl:text-[92px] 2xl:text-[104px] font-black tracking-tighter text-white leading-none text-center w-full"
                    />
                </div>

                {/* Video Cards with Intelligent Snap Scrolling */}
                <div ref={containerRef} style={{ paddingBottom: '8rem' }}>
                    {demoVideos.map((video, index) => (
                        <div
                            key={video.id}
                            ref={(el) => {
                                if (el) cardsRef.current[index] = el;
                            }}
                            className="w-full max-w-[1440px] mx-auto"
                            style={{
                                minHeight: '630px',
                                aspectRatio: '16/9',
                            }}
                        >
                            <VideoCard
                                src={video.src}
                                title={video.title}
                                description={video.description}
                                index={index}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
