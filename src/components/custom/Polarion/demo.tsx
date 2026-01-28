'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, FileText } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { BlurText } from '@/components/ui/blur-text';

// Custom Code Icon Component
const CodeIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" stroke="white" />
    </svg>
);

const demoFeatures = [
    {
        title: 'EARS/INCOSE',
        description: 'Clean, unambiguous phrasing.',
        icon: FileText,
    },
    {
        title: 'Spot Conflicts',
        description: 'One prompt highlights every clashing requirement.',
        icon: AlertTriangle,
    },
    {
        title: 'Code & Tests from Every Requirement',
        description:
            'Generates implementation and unit tests, grounded in your full spec—REQ IDs preserved.',
        icon: CodeIcon,
    },
];

export function PolarionDemo() {
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
        <section className="relative py-12 md:py-16 bg-[#0f0f0f] scroll-smooth text-white">
            <div className="max-w-[1800px] mx-auto px-4 md:px-8">
                {/* Section Title */}
                <div className="mb-12 md:mb-16">
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

                <div className="w-full max-w-[1200px] mx-auto mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full"
                    >
                        <div
                            className={`relative bg-[#0f0f0f] backdrop-blur-sm overflow-hidden group h-full transition-all duration-300 p-4`}
                        >
                            <div className="relative w-full h-full">
                                <video
                                    ref={videoRef}
                                    src="/demo1_steering_edited.mp4"
                                    className="w-full h-full object-contain"
                                    muted
                                    loop
                                    playsInline
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 text-white z-10">
                                    <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 tracking-tight">
                                        Smart Requirements Steering
                                    </h3>
                                    <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-300/90">
                                        AI-powered requirement navigation and management
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                {/* Demo Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 lg:gap-24 max-w-6xl mx-auto">
                    {demoFeatures.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                            className="group relative border-t-2 border-white pt-8 text-center will-change-transform"
                        >
                            {/* Icon */}
                            <div className="mb-6 flex justify-center">
                                <feature.icon className="w-16 h-16 text-[#7f00ff] group-hover:text-white transition-colors duration-300" />
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-white mb-4 text-white tracking-tight">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-base md:text-lg text-gray-00 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Hover Effect Line */}
                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
