'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export function PolarionVideoComparison() {
    const videoRef1 = useRef<HTMLVideoElement | null>(null);
    const videoRef2 = useRef<HTMLVideoElement | null>(null);
    const videoRef3 = useRef<HTMLVideoElement | null>(null);

    // Autoplay when videos scroll into view; pause when out of view
    useEffect(() => {
        const video1 = videoRef1.current;
        const video2 = videoRef2.current;
        const video3 = videoRef3.current;
        if (!video1 || !video2 || !video3) return;

        const tryPlay = (video: HTMLVideoElement) => {
            const p = video.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {});
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const video = entry.target as HTMLVideoElement;
                    if (entry.isIntersecting) {
                        tryPlay(video);
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.5 },
        );

        observer.observe(video1);
        observer.observe(video2);
        observer.observe(video3);
        return () => observer.disconnect();
    }, []);

    return (
        <article>
            <section className="h-screen w-full bg-[#0f0f0f] text-white flex items-center sticky top-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-white" />
                <div className="max-w-[1600px] mx-auto px-4 md:px-8 w-full">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                        {/* Left - Text (25% of screen) */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: false, amount: 0.5 }}
                            className="w-full lg:w-[25%] space-y-3 lg:pt-8"
                        >
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                viewport={{ once: false, amount: 0.5 }}
                                className="text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold tracking-tight"
                            >
                                Regulatory Compliance
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                viewport={{ once: false, amount: 0.5 }}
                                className="text-sm md:text-base lg:text-base xl:text-lg text-gray-300/90"
                            >
                                Verify requirements against INCOSE <br />
                                and regulatory standards
                            </motion.p>
                        </motion.div>

                        {/* Right - Video (70% of screen) */}
                        <div className="w-full lg:w-[70%] relative bg-[#0f0f0f] backdrop-blur-sm overflow-hidden group transition-all duration-300 p-4 rounded-lg">
                            <video
                                ref={videoRef1}
                                src="/demo4_regulation+incose_edit.mp4"
                                className="w-full object-contain rounded-lg"
                                muted
                                loop
                                playsInline
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="h-screen w-full bg-[#0f0f0f] text-white flex items-center sticky top-0 rounded-tr-2xl rounded-tl-2xl overflow-hidden">
                <div className="max-w-[1600px] mx-auto px-4 md:px-8 w-full">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                        {/* Left - Text (25% of screen) */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: false, amount: 0.5 }}
                            className="w-full lg:w-[25%] space-y-3 lg:pt-8"
                        >
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                viewport={{ once: false, amount: 0.5 }}
                                className="text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold tracking-tight"
                            >
                                Code Generation
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                viewport={{ once: false, amount: 0.5 }}
                                className="text-sm md:text-base lg:text-base xl:text-lg text-gray-300/90"
                            >
                                Generate code directly from requirements
                            </motion.p>
                        </motion.div>

                        {/* Right - Video (70% of screen) */}
                        <div className="w-full lg:w-[70%] relative bg-[#0f0f0f] backdrop-blur-sm overflow-hidden group transition-all duration-300 p-4 rounded-lg">
                            <video
                                ref={videoRef2}
                                src="/demo7_edit_code.mp4"
                                className="w-full object-contain rounded-lg"
                                muted
                                loop
                                playsInline
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="h-screen w-full bg-[#0f0f0f] text-white flex items-center sticky top-0 rounded-tr-2xl rounded-tl-2xl overflow-hidden">
                <div className="max-w-[1600px] mx-auto px-4 md:px-8 w-full">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                        {/* Left - Text (25% of screen) */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: false, amount: 0.5 }}
                            className="w-full lg:w-[25%] space-y-3 lg:pt-8"
                        >
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                viewport={{ once: false, amount: 0.5 }}
                                className="text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold tracking-tight"
                            >
                                Test Case Generation
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                viewport={{ once: false, amount: 0.5 }}
                                className="text-sm md:text-base lg:text-base xl:text-lg text-gray-300/90"
                            >
                                Automatically generate comprehensive test cases from
                                requirements
                            </motion.p>
                        </motion.div>

                        {/* Right - Video (70% of screen) */}
                        <div className="w-full lg:w-[70%] relative bg-[#0f0f0f] backdrop-blur-sm overflow-hidden group transition-all duration-300 p-4 rounded-lg">
                            <video
                                ref={videoRef3}
                                src="/Demo5_edit.mp4"
                                className="w-full object-contain rounded-lg"
                                muted
                                loop
                                playsInline
                            />
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
            </section>
        </article>
    );
}
