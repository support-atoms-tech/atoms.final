'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, FileText } from 'lucide-react';
import { useEffect, useRef } from 'react';

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
        <section className="border-none py-24 md:py-32 lg:py-40 relative bg-[#0f0f0f]  text-white">
            <div className="container mx-auto px-4">
                {/* Demo Image */}
                {/* Section Title */}
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-white leading-none mb-16 md:mb-24 text-center"
                >
                    SEE IT IN ACTION
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative"
                >
                    {/* Floating Demo Container */}
                    <div className="relative group">
                        {/* Main Image Container */}
                        <div className="relative bg-black/50 backdrop-blur-sm rounded-0.1 border border-black/10 overflow-hidden shadow-2xl mb-10">
                            <video
                                ref={videoRef}
                                src="/cursor__polarian-v.mp4"
                                className="w-full h-auto object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                                poster="/cursor__polarian.jpg"
                            />

                            {/* Overlay with subtle gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </div>
                    </div>

                    {/* Feature Callouts */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="absolute -left-8 top-[30%] transform -translate-y-1/2 hidden xl:block"
                    >
                        <div className="bg-white/40 backdrop-blur-md rounded-lg p-4 border border-white/30 shadow-lg">
                            <div className="text-[#9B51E0] font-bold text-sm mb-1">
                                Work Items
                            </div>
                            <div className="text-[#9B51E0] text-xs">
                                Instant access & updates
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="absolute -right-8 bottom-1/4 hidden xl:block"
                    >
                        <div className="bg-white/40 backdrop-blur-md rounded-lg p-4 border border-white/30 shadow-lg">
                            <div className="text-white font-bold text-sm mb-1">
                                AI Chat
                            </div>
                            <div className="text-[#E5E5E5] text-xs">
                                Natural language queries
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
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
                                <feature.icon className="w-16 h-16 text-[#9B51E0] group-hover:text-white transition-colors duration-300" />
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
