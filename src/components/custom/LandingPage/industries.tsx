'use client';

import { motion } from 'framer-motion';
import { Activity, Car, Cpu, Rocket, Shield, Zap } from 'lucide-react';

import { BlurText } from '@/components/ui/blur-text';

const industries = [
    {
        name: 'AUTOMOTIVE',
        icon: Car,
        description:
            'Trace every requirement across the entire vehicle stack—from powertrain and braking to EV, ADAS, and connected-car systems.',
    },
    {
        name: 'HEALTHCARE',
        icon: Activity,
        description:
            'Align medical devices with key standards—such as ISO 13485, ISO 14971, and IEC 62304.',
    },
    {
        name: 'AEROSPACE',
        icon: Rocket,
        description:
            'Meet critical aviation regulations—such as DO-178C, DO-254, and ARP-4754A.',
    },
    {
        name: 'ENERGY',
        icon: Zap,
        description:
            'Hit safety & environmental regs across wind, solar, oil & gas, and large-scale energy storage.',
    },
    {
        name: 'ROBOTICS',
        icon: Cpu,
        description: 'Synchronize multi-sensor autonomy with full traceability.',
    },
    {
        name: 'DEFENSE / DoD',
        icon: Shield,
        description: 'Deliver bulletproof compliance for high-stakes programs.',
    },
];

export function Industries() {
    return (
        <section
            id="safety-critical-systems"
            className="py-24 md:py-32 lg:py-40 relative bg-white text-black"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <div className="container mx-auto px-4">
                <BlurText
                    text="BUILT FOR SAFETY-CRITICAL SYSTEMS"
                    as="h2"
                    delay={150}
                    animateBy="words"
                    direction="top"
                    stepDuration={0.4}
                    className="text-[32px] xs:text-[40px] sm:text-[48px] md:text-[60px] lg:text-[76px] xl:text-[92px] 2xl:text-[104px] font-black tracking-tighter text-black leading-none mb-16 md:mb-24 text-center w-full"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 lg:gap-24 max-w-6xl mx-auto">
                    {industries.map((industry, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.7,
                                delay: index * 0.12,
                                ease: 'easeOut',
                            }}
                            viewport={{ once: true, amount: 0.2 }}
                            whileHover={{
                                scale: 1.03,
                                transition: { duration: 0.25, ease: 'easeOut' },
                            }}
                            className="group relative border-t-2 border-black pt-8 will-change-transform"
                        >
                            <div className="mb-6">
                                <industry.icon className="w-12 h-12 text-[#7f00ff] group-hover:text-black transition-colors duration-300" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black mb-4 text-black tracking-tight">
                                {industry.name}
                            </h3>
                            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                                {industry.description}
                            </p>
                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-black group-hover:w-full transition-all duration-300" />
                        </motion.div>
                    ))}
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black" />
        </section>
    );
}
