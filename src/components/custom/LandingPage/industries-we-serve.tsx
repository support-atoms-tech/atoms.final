'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BlurText } from '@/components/ui/blur-text';

import { AerospaceDisplay } from './IndustryCards/AerospaceDisplay';
import { BlueprintDisplay } from './IndustryCards/BlueprintDisplay';
import { DefenceDisplay } from './IndustryCards/DefenceDisplay';
import { HealthcareDisplay } from './IndustryCards/HealthcareDisplay';
import { RailwayDisplay } from './IndustryCards/RailwayDisplay';
import { RoboticsDisplay } from './IndustryCards/RoboticsDisplay';
import { SoftwareDisplay } from './IndustryCards/SoftwareDisplay';
import { SpaceDisplay } from './IndustryCards/SpaceDisplay';

const cards = [
    { id: 1, Component: BlueprintDisplay },
    { id: 2, Component: AerospaceDisplay },
    { id: 3, Component: RailwayDisplay },
    { id: 4, Component: HealthcareDisplay },
    { id: 5, Component: SpaceDisplay },
    { id: 6, Component: SoftwareDisplay },
    { id: 7, Component: RoboticsDisplay },
    { id: 8, Component: DefenceDisplay },
];

function CardWrapper({
    Component,
    index,
    animationKey,
}: {
    Component: React.ComponentType;
    index: number;
    animationKey: number;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ['start end', 'end start'],
    });

    // Transform values based on scroll
    const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);
    const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -5]);

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{
                opacity: 1,
                y: 0,
            }}
            viewport={{
                once: false,
                amount: 0.3,
                margin: '-100px',
            }}
            transition={{
                duration: 0.5,
                delay: 0.05 * index,
            }}
            className="w-full rounded-lg overflow-hidden"
            style={{ height: '320px' }}
        >
            <motion.div
                key={animationKey}
                style={{
                    y,
                    opacity,
                    scale,
                    rotateX,
                    height: '100%',
                    transformStyle: 'preserve-3d',
                }}
                whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.3 },
                }}
                transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                }}
            >
                <Component />
            </motion.div>
        </motion.div>
    );
}

export function IndustriesWeServe() {
    const [animationKeys, setAnimationKeys] = useState<number[]>(
        Array(cards.length).fill(0),
    );
    const [initialAnimationComplete, setInitialAnimationComplete] = useState(false);

    // Wait for initial animations to complete (approx 3 seconds)
    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialAnimationComplete(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const triggerRandomCardAnimation = useCallback(() => {
        if (!initialAnimationComplete) return;

        // Pick a random card index
        const randomIndex = Math.floor(Math.random() * cards.length);

        // Increment the animation key for that card
        setAnimationKeys((prev) => {
            const newKeys = [...prev];
            newKeys[randomIndex] = prev[randomIndex] + 1;
            return newKeys;
        });

        // Schedule next random animation after 4-7 seconds
        const nextDelay = 4000 + Math.random() * 3000;
        setTimeout(triggerRandomCardAnimation, nextDelay);
    }, [initialAnimationComplete]);

    // Start the random animation cycle
    useEffect(() => {
        if (initialAnimationComplete) {
            // Wait a bit before starting the cycle
            const timer = setTimeout(triggerRandomCardAnimation, 2000);
            return () => clearTimeout(timer);
        }
    }, [initialAnimationComplete, triggerRandomCardAnimation]);

    return (
        <section className="relative py-24 px-4 bg-[#0f0f0f]">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <BlurText
                    text="INDUSTRIES WE SERVE"
                    as="h2"
                    delay={150}
                    animateBy="words"
                    direction="top"
                    stepDuration={0.4}
                    className="text-[32px] xs:text-[40px] sm:text-[48px] md:text-[60px] lg:text-[76px] xl:text-[92px] 2xl:text-[104px] font-black tracking-tighter text-white leading-none mb-8 md:mb-12 text-center w-full"
                />

                {/* Industry Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, index) => (
                        <CardWrapper
                            key={card.id}
                            Component={card.Component}
                            index={index}
                            animationKey={animationKeys[index]}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
