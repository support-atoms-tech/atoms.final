'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { BlurText } from '@/components/ui/blur-text';

export function PolarionImpact() {
    const items = [
        {
            image: '/bug-impact.png',
            title: 'Find Issues Earlier',
            subtext: '60-80% FASTER',
        },
        { image: '/codefast-impact.png', title: 'Code Fast', subtext: '55% FASTER' },
        {
            image: '/launchfast-impact.png',
            title: 'Launch Safer',
            subtext: '10-20% Fewer Recalls',
        },
    ];

    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Autoplay when the video scrolls into view; pause when out of view
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const tryPlay = () => {
            const p = video.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {});
            }
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    tryPlay();
                } else {
                    video.pause();
                }
            },
            { threshold: 0.5 },
        );

        observer.observe(video);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="py-24 md:py-32 lg:py-40 relative bg-[#0f0f0f] text-white">
            {/* Match SEE IT IN ACTION width + padding so video containers align visually */}
            <div className="max-w-[1800px] mx-auto px-4 md:px-8">
                <BlurText
                    text="THE IMPACT"
                    as="h2"
                    delay={150}
                    animateBy="words"
                    direction="top"
                    stepDuration={0.4}
                    className="text-[32px] xs:text-[40px] sm:text-[48px] md:text-[60px] lg:text-[76px] xl:text-[92px] 2xl:text-[104px] font-black tracking-tighter text-white leading-none mb-16 text-center w-full"
                />

                {/* Inline SEE IT IN ACTION-style video card */}
                <div className="w-full max-w-[1200px] mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full"
                    >
                        <div className="relative bg-[#0f0f0f] backdrop-blur-sm overflow-hidden group h-full transition-all duration-300 p-4">
                            <div className="relative w-full h-full">
                                <video
                                    ref={videoRef}
                                    src="/demo6_export_pdf_excel_eidt.mp4"
                                    className="w-full h-full object-contain"
                                    muted
                                    loop
                                    playsInline
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 text-white z-10">
                                    <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 tracking-tight">
                                        Export to PDF & Excel
                                    </h3>
                                    <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-300/90">
                                        Export your data seamlessly to PDF and Excel
                                        formats
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    {items.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: idx * 0.2 }}
                            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                            className="group relative text-center border-t-2 border-white pt-8 will-change-transform"
                        >
                            <div className="relative mx-auto mb-6 h-40 w-40">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    sizes="10rem"
                                    className="object-contain transition-all duration-300 group-hover:brightness-110"
                                />
                            </div>
                            <p className="text-2xl md:text-3xl mb-2">{item.title}</p>
                            <p className="text-lg md:text-xl font-semibold text-gray-300">
                                {item.subtext}
                            </p>
                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
