'use client';

import { motion } from 'framer-motion';

import ShinyText from '@/components/ui/shiny-text';
import StarBorder from '@/components/ui/star-border';
import TrueFocus from '@/components/ui/true-focus';

export function PolarionHero() {
    return (
        <section className="bg-[url('/nodesbackground.jpg')] bg-cover bg-center min-h-screen flex items-center justify-center pt-20 text-white relative overflow-hidden">
            {/* Background overlay - gradient from black (60% from top) to gray (bottom-right) */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 from-60% to-gray-800/80" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />

            <div className="container mx-auto px-4 relative z-20">
                <div className="max-w-7xl mx-auto">
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 gap-16 lg:gap-24 items-center">
                        {/* Left Column - Text Content */}
                        <div className="text-center">
                            {/* Main Title */}
                            <motion.h1
                                initial={{ opacity: 0, y: -30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-[32px] xs:text-[40px] sm:text-[48px] md:text-[64px] lg:text-[80px] xl:text-[96px] 2xl:text-[112px] font-black tracking-tighter text-white leading-none mb-8"
                            >
                                <span className="block">POLARION</span>
                                <span className="block whitespace-nowrap">
                                    MEET CURSOR-LEVEL AI
                                </span>
                            </motion.h1>

                            {/* Subtitle */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                                className="mb-12 leading-relaxed"
                            >
                                <ShinyText
                                    text="Chat with every work item, "
                                    speed={3}
                                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl"
                                />
                                <div className="inline-block">
                                    <TrueFocus
                                        sentence="Trace, Test, Even Code"
                                        separator=", "
                                        manualMode={false}
                                        blurAmount={3}
                                        borderColor="#a78bfa"
                                        glowColor="rgba(167, 139, 250, 0.6)"
                                        animationDuration={0.8}
                                        pauseBetweenAnimations={1.5}
                                    />
                                </div>
                            </motion.div>

                            {/* CTA Button */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                                className="flex justify-center"
                            >
                                <StarBorder
                                    as="div"
                                    color="white"
                                    speed="4s"
                                    thickness={2}
                                    className="hover:scale-105 transition-transform duration-200"
                                >
                                    <button
                                        className="inline-flex items-center justify-center gap-2 relative overflow-hidden p-0.5 rounded-full group bg-gradient-to-br from-purple-600 to-blue-500"
                                        onClick={() =>
                                            window.open(
                                                'mailto:hello@atoms.tech?subject=Polarian - ATOMS',
                                                '_self',
                                            )
                                        }
                                    >
                                        <span className="relative px-16 py-8 text-xl font-semibold text-white bg-black rounded-full group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:to-blue-500 transition-all duration-200">
                                            REQUEST DEMO
                                        </span>
                                    </button>
                                </StarBorder>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
