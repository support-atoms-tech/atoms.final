'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRightLeft, Layers, MessageCircle, Zap } from 'lucide-react';
import { useRef } from 'react';

import { BlurText } from '@/components/ui/blur-text';

const groundbreakingFeatures = [
    {
        title: 'Ask Anything',
        description: 'plain-language Q&A across requirements, tests, and links.',
        icon: MessageCircle,
    },
    {
        title: 'Instant Hygiene',
        description: 'duplicates, gaps, and contradictions surfaced in seconds.',
        icon: Zap,
    },
    {
        title: 'One-Step Synthesis',
        description: 'tests, diagrams, and real code generated from context.',
        icon: Layers,
    },
    {
        title: 'All-in-One View',
        description: 'Requirements, tests, and code together — traceability intact.',
        icon: ArrowRightLeft,
    },
];

function FeatureCard({ feature }: { feature: (typeof groundbreakingFeatures)[0] }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    // Calculate distance from viewport center (0 = center, -1 = top, 1 = bottom)
    const distanceFromCenter = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0, 1]);

    // Spotlight opacity: brightest at center
    const opacity = useTransform(distanceFromCenter, [0, 0.5, 1], [1, 0.45, 0.45]);

    // Gentle scale: slightly larger when entering, biggest near center, smaller as it exits
    const scale = useTransform(distanceFromCenter, [0, 0.5, 1], [1.06, 1, 0.94]);

    // Smooth semi-circular motion with an imaginary center on the right edge.
    // As you scroll bottom → center → top, cards move along a left-hand arc
    // around that right-side center (down-left → far-left center → up-left).
    // Arc shape:
    // - when card is lower in the viewport (entering), it sits slightly to the left & down
    // - around the center it is farthest to the left
    // - as it moves toward the top, it swings back up and to the RIGHT
    const x = useTransform(scrollYProgress, [0, 0.5, 1], [-32, -72, 24]);
    const y = useTransform(scrollYProgress, [0, 0.5, 1], [32, 0, -32]);

    // Icon color intensity
    const iconOpacity = useTransform(distanceFromCenter, [0, 0.5], [1, 0.4]);

    return (
        <motion.div
            ref={ref}
            // Let scroll-based transforms drive everything (no extra entrance animation)
            initial={false}
            style={{
                opacity,
                x,
                scale,
                y,
            }}
            className="group relative border-t-2 border-white pt-8"
        >
            {/* Title with Icon */}
            <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 text-white tracking-tight flex items-start">
                <motion.div style={{ opacity: iconOpacity }}>
                    <feature.icon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#7f00ff] group-hover:text-white transition-colors duration-300 mr-3 mt-1 flex-shrink-0" />
                </motion.div>
                <span>{feature.title}</span>
            </h3>

            {/* Description */}
            <p className="text-base md:text-lg text-[#B5B5B5] leading-relaxed ml-11 md:ml-12 lg:ml-14">
                {feature.description}
            </p>
        </motion.div>
    );
}

export function PolarionWhyGroundbreaking() {
    return (
        <section className="py-24 md:py-32 lg:py-40 relative bg-[#0f0f0f] text-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="container mx-auto px-4">
                {/* Two Column Layout */}
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-24 max-w-7xl mx-auto">
                    {/* Left Side - Title */}
                    <div className="flex-1 flex items-start justify-start">
                        <div className="sticky top-20 text-left">
                            <BlurText
                                text="WHY"
                                as="h2"
                                delay={150}
                                animateBy="words"
                                direction="top"
                                stepDuration={0.4}
                                center={false}
                                className="text-[32px] xs:text-[40px] sm:text-[48px] md:text-[60px] lg:text-[76px] xl:text-[92px] 2xl:text-[104px] font-black tracking-tighter text-white leading-none text-left"
                            />
                            <BlurText
                                text="IT'S PIVOTAL"
                                as="span"
                                delay={300}
                                animateBy="words"
                                direction="top"
                                stepDuration={0.4}
                                center={false}
                                className="text-[32px] xs:text-[40px] sm:text-[48px] md:text-[60px] lg:text-[76px] xl:text-[92px] 2xl:text-[104px] font-black tracking-tighter text-white leading-none block text-left"
                            />
                        </div>
                    </div>

                    {/* Right Side - Features */}
                    <div className="flex-1 space-y-12">
                        {groundbreakingFeatures.map((feature, index) => (
                            <FeatureCard key={index} feature={feature} />
                        ))}
                    </div>
                </div>

                {/* Additional Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-16 md:mt-24 text-center"
                >
                    <p className="text-lg md:text-xl text-[#B5B5B5] max-w-4xl mx-auto leading-relaxed">
                        (Read-only today for total data safety. Write-back lands next
                        release.)
                    </p>
                </motion.div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
        </section>
    );
}
