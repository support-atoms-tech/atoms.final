'use client';

import { motion } from 'framer-motion';

export function SpaceDisplay() {
    return (
        <div className="w-full h-full p-2">
            <div className="relative bg-[#0f0f0f] rounded-lg overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0">
                    <svg width="100%" height="100%" className="opacity-10">
                        <defs>
                            <pattern
                                id="smallGridDefence"
                                width="20"
                                height="20"
                                patternUnits="userSpaceOnUse"
                            >
                                <path
                                    d="M 20 0 L 0 0 0 20"
                                    fill="none"
                                    stroke="#7F00FF"
                                    strokeWidth="0.5"
                                />
                            </pattern>
                            <pattern
                                id="gridDefence"
                                width="100"
                                height="100"
                                patternUnits="userSpaceOnUse"
                            >
                                <rect
                                    width="100"
                                    height="100"
                                    fill="url(#smallGridDefence)"
                                />
                                <path
                                    d="M 100 0 L 0 0 0 100"
                                    fill="none"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridDefence)" />
                    </svg>
                </div>

                <div className="relative p-4 md:p-6 flex-1 flex flex-col">
                    <div className="mb-3">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wider text-center w-full">
                                Space
                            </h2>
                        </motion.div>
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 1.2, delay: 0.3 }}
                            className="h-0.5 bg-[#7F00FF] mt-3"
                        />
                    </div>

                    <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                        <svg
                            viewBox="0 0 400 280"
                            className="w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                            fill="none"
                            stroke="#7F00FF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <defs>
                                <filter id="glowDefence">
                                    <feGaussianBlur
                                        stdDeviation="3"
                                        result="coloredBlur"
                                    />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient
                                    id="flameGradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="0%"
                                    y2="100%"
                                >
                                    <stop offset="0%" stopColor="#7F00FF" />
                                    <stop
                                        offset="100%"
                                        stopColor="#7F00FF"
                                        stopOpacity="0"
                                    />
                                </linearGradient>
                            </defs>

                            {/* Launch pad / ground */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 0.5 }}
                            >
                                <line
                                    x1="120"
                                    y1="265"
                                    x2="280"
                                    y2="265"
                                    strokeWidth="3"
                                />
                                <line
                                    x1="150"
                                    y1="265"
                                    x2="150"
                                    y2="275"
                                    strokeWidth="2"
                                />
                                <line
                                    x1="200"
                                    y1="265"
                                    x2="200"
                                    y2="275"
                                    strokeWidth="2"
                                />
                                <line
                                    x1="250"
                                    y1="265"
                                    x2="250"
                                    y2="275"
                                    strokeWidth="2"
                                />
                            </motion.g>

                            {/* Rocket with takeoff animation */}
                            <motion.g
                                initial={{ y: 0 }}
                                animate={{ y: [0, -25, 0] }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                {/* Rocket body */}
                                <motion.path
                                    d="M 200 60 L 185 100 L 185 180 L 215 180 L 215 100 Z"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    strokeWidth="2"
                                    filter="url(#glowDefence)"
                                />

                                {/* Nose cone */}
                                <motion.path
                                    d="M 200 40 Q 195 50 190 65 L 200 60 L 210 65 Q 205 50 200 40"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                    strokeWidth="2"
                                    filter="url(#glowDefence)"
                                />

                                {/* Window */}
                                <motion.circle
                                    cx="200"
                                    cy="110"
                                    r="12"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: 1 }}
                                    strokeWidth="2"
                                />
                                <motion.circle
                                    cx="200"
                                    cy="110"
                                    r="8"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: 1.1 }}
                                    strokeWidth="1.5"
                                />

                                {/* Body stripes */}
                                <motion.line
                                    x1="185"
                                    y1="130"
                                    x2="215"
                                    y2="130"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3, delay: 1.2 }}
                                    strokeWidth="1.5"
                                />
                                <motion.line
                                    x1="185"
                                    y1="150"
                                    x2="215"
                                    y2="150"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3, delay: 1.3 }}
                                    strokeWidth="1.5"
                                />

                                {/* Left fin */}
                                <motion.path
                                    d="M 185 160 L 165 195 L 165 205 L 185 185"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 1.4 }}
                                    strokeWidth="2"
                                />

                                {/* Right fin */}
                                <motion.path
                                    d="M 215 160 L 235 195 L 235 205 L 215 185"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 1.4 }}
                                    strokeWidth="2"
                                />

                                {/* Center fin / engine */}
                                <motion.path
                                    d="M 190 180 L 190 200 L 200 210 L 210 200 L 210 180"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 1.5 }}
                                    strokeWidth="2"
                                />

                                {/* Exhaust flames - realistic flickering */}
                                <motion.path
                                    d="M 195 210 Q 190 230 200 250 Q 210 230 205 210"
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: [0.7, 1, 0.8, 1, 0.7],
                                        scaleY: [0.9, 1.3, 1.1, 1.2, 0.9],
                                        scaleX: [1, 0.95, 1.05, 0.98, 1],
                                    }}
                                    transition={{
                                        duration: 0.4,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                    stroke="#7F00FF"
                                    strokeWidth="2"
                                    filter="url(#glowDefence)"
                                    style={{ transformOrigin: '200px 210px' }}
                                />
                                <motion.path
                                    d="M 197 215 Q 193 235 200 265 Q 207 235 203 215"
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: [0.5, 0.9, 0.6, 0.85, 0.5],
                                        scaleY: [0.8, 1.5, 1.2, 1.4, 0.8],
                                        scaleX: [1, 0.9, 1.1, 0.95, 1],
                                    }}
                                    transition={{
                                        duration: 0.35,
                                        repeat: Infinity,
                                        delay: 0.1,
                                        ease: 'easeInOut',
                                    }}
                                    stroke="#7F00FF"
                                    strokeWidth="1.5"
                                    filter="url(#glowDefence)"
                                    style={{ transformOrigin: '200px 215px' }}
                                />
                                <motion.path
                                    d="M 198 220 Q 195 245 200 270 Q 205 245 202 220"
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: [0.3, 0.7, 0.4, 0.65, 0.3],
                                        scaleY: [0.7, 1.6, 1.3, 1.5, 0.7],
                                        scaleX: [1, 0.85, 1.15, 0.9, 1],
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        repeat: Infinity,
                                        delay: 0.2,
                                        ease: 'easeInOut',
                                    }}
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                    filter="url(#glowDefence)"
                                    style={{ transformOrigin: '200px 220px' }}
                                />

                                {/* Flame particles - more realistic spread */}
                                <motion.circle
                                    cx="195"
                                    cy="240"
                                    r="3"
                                    animate={{
                                        y: [0, 25, 35],
                                        x: [-2, -5, -8],
                                        opacity: [0.9, 0.5, 0],
                                        scale: [1, 1.2, 0.5],
                                    }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                    fill="#7F00FF"
                                    filter="url(#glowDefence)"
                                />
                                <motion.circle
                                    cx="205"
                                    cy="245"
                                    r="2.5"
                                    animate={{
                                        y: [0, 30, 40],
                                        x: [2, 6, 10],
                                        opacity: [0.8, 0.4, 0],
                                        scale: [1, 1.3, 0.4],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        delay: 0.15,
                                    }}
                                    fill="#7F00FF"
                                    filter="url(#glowDefence)"
                                />
                                <motion.circle
                                    cx="200"
                                    cy="250"
                                    r="3"
                                    animate={{
                                        y: [0, 28, 38],
                                        opacity: [0.85, 0.45, 0],
                                        scale: [1, 1.25, 0.3],
                                    }}
                                    transition={{
                                        duration: 0.55,
                                        repeat: Infinity,
                                        delay: 0.08,
                                    }}
                                    fill="#7F00FF"
                                    filter="url(#glowDefence)"
                                />
                                <motion.circle
                                    cx="198"
                                    cy="255"
                                    r="2"
                                    animate={{
                                        y: [0, 20, 30],
                                        x: [-1, -3, -6],
                                        opacity: [0.7, 0.3, 0],
                                        scale: [1, 1.4, 0.2],
                                    }}
                                    transition={{
                                        duration: 0.45,
                                        repeat: Infinity,
                                        delay: 0.25,
                                    }}
                                    fill="#7F00FF"
                                    filter="url(#glowDefence)"
                                />
                                <motion.circle
                                    cx="202"
                                    cy="258"
                                    r="2"
                                    animate={{
                                        y: [0, 22, 32],
                                        x: [1, 4, 7],
                                        opacity: [0.75, 0.35, 0],
                                        scale: [1, 1.35, 0.25],
                                    }}
                                    transition={{
                                        duration: 0.48,
                                        repeat: Infinity,
                                        delay: 0.18,
                                    }}
                                    fill="#7F00FF"
                                    filter="url(#glowDefence)"
                                />
                            </motion.g>

                            {/* Smoke clouds at base */}
                            <motion.g>
                                <motion.ellipse
                                    cx="170"
                                    cy="255"
                                    rx="20"
                                    ry="8"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 0.4, 0],
                                        scale: [0.5, 1.3, 1.5],
                                        x: [-15, -25],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: 0,
                                    }}
                                    strokeWidth="1"
                                />
                                <motion.ellipse
                                    cx="230"
                                    cy="253"
                                    rx="18"
                                    ry="7"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 0.3, 0],
                                        scale: [0.5, 1.2, 1.4],
                                        x: [15, 25],
                                    }}
                                    transition={{
                                        duration: 2.2,
                                        repeat: Infinity,
                                        delay: 0.3,
                                    }}
                                    strokeWidth="1"
                                />
                                <motion.ellipse
                                    cx="200"
                                    cy="258"
                                    rx="18"
                                    ry="7"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 0.35, 0],
                                        scale: [0.6, 1.2, 1.4],
                                    }}
                                    transition={{
                                        duration: 1.8,
                                        repeat: Infinity,
                                        delay: 0.5,
                                    }}
                                    strokeWidth="1"
                                />
                            </motion.g>

                            {/* Radar dish decoration */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 2 }}
                            >
                                <motion.path
                                    d="M 70 190 Q 90 170 110 190"
                                    strokeWidth="2"
                                    animate={{ rotate: [0, 15, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    style={{
                                        transformOrigin: `90px 190px`,
                                        transformBox: 'fill-box',
                                    }}
                                />
                                <line x1="90" y1="190" x2="90" y2="215" strokeWidth="2" />
                                <rect
                                    x="80"
                                    y="215"
                                    width="20"
                                    height="10"
                                    strokeWidth="1.5"
                                />
                            </motion.g>

                            {/* Target crosshair decoration */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                transition={{ delay: 2.2 }}
                            >
                                <circle cx="310" cy="100" r="18" strokeWidth="1.5" />
                                <circle cx="310" cy="100" r="10" strokeWidth="1" />
                                <circle
                                    cx="310"
                                    cy="100"
                                    r="3"
                                    strokeWidth="1"
                                    fill="#7F00FF"
                                />
                                <line
                                    x1="310"
                                    y1="78"
                                    x2="310"
                                    y2="86"
                                    strokeWidth="1.5"
                                />
                                <line
                                    x1="310"
                                    y1="114"
                                    x2="310"
                                    y2="122"
                                    strokeWidth="1.5"
                                />
                                <line
                                    x1="288"
                                    y1="100"
                                    x2="296"
                                    y2="100"
                                    strokeWidth="1.5"
                                />
                                <line
                                    x1="324"
                                    y1="100"
                                    x2="332"
                                    y2="100"
                                    strokeWidth="1.5"
                                />
                            </motion.g>

                            {/* Shield emblem */}
                            <motion.path
                                d="M 70 80 L 70 105 Q 70 122 87 130 Q 104 122 104 105 L 104 80 L 87 72 Z"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.4 }}
                                transition={{ duration: 1, delay: 2.5 }}
                                strokeWidth="2"
                            />
                        </svg>
                    </div>
                </div>

                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#7F00FF]" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#7F00FF]" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#7F00FF]" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#7F00FF]" />
                <div className="absolute top-3 left-9 right-9 h-px bg-[#7F00FF]/30" />
                <div className="absolute bottom-3 left-9 right-9 h-px bg-[#7F00FF]/30" />
                <div className="absolute left-3 top-9 bottom-9 w-px bg-[#7F00FF]/30" />
                <div className="absolute right-3 top-9 bottom-9 w-px bg-[#7F00FF]/30" />
            </div>
        </div>
    );
}
