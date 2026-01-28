'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export function PolarionRegulationVideo() {
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
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="max-w-[1800px] mx-auto px-4 md:px-8">
                <div className="w-full max-w-[1200px] mx-auto">
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
                                    src="/demo4_regulation+incose_edit.mp4"
                                    className="w-full h-full object-contain"
                                    muted
                                    loop
                                    playsInline
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 text-white z-10">
                                    <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 tracking-tight">
                                        Regulatory Compliance
                                    </h3>
                                    <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-300/90">
                                        Verify requirements against INCOSE and regulatory
                                        standards
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
        </section>
    );
}
