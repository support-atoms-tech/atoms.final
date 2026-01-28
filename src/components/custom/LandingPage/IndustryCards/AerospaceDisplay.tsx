'use client';

import { motion } from 'framer-motion';

export function AerospaceDisplay() {
    return (
        <div className="w-full h-full p-2">
            <div className="relative bg-[#0f0f0f] rounded-lg overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0">
                    <svg width="100%" height="100%" className="opacity-10">
                        <defs>
                            <pattern
                                id="smallGridAero"
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
                                id="gridAero"
                                width="100"
                                height="100"
                                patternUnits="userSpaceOnUse"
                            >
                                <rect
                                    width="100"
                                    height="100"
                                    fill="url(#smallGridAero)"
                                />
                                <path
                                    d="M 100 0 L 0 0 0 100"
                                    fill="none"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridAero)" />
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
                                Aerospace
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
                            viewBox="0 0 400 260"
                            className="w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                            fill="none"
                            stroke="#7F00FF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <defs>
                                <filter id="glowAero">
                                    <feGaussianBlur
                                        stdDeviation="2"
                                        result="coloredBlur"
                                    />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Realistic Clouds with multiple layers */}
                            <motion.g
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ x: -140, opacity: [0, 0.5, 0.5, 0] }}
                                transition={{
                                    duration: 12,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                            >
                                {/* Cloud 1 - Fluffy cumulus style */}
                                <ellipse
                                    cx="80"
                                    cy="40"
                                    rx="25"
                                    ry="12"
                                    fill="#7F00FF"
                                    fillOpacity="0.08"
                                    stroke="#7F00FF"
                                    strokeWidth="1.5"
                                    opacity="0.6"
                                />
                                <ellipse
                                    cx="95"
                                    cy="35"
                                    rx="20"
                                    ry="10"
                                    fill="#7F00FF"
                                    fillOpacity="0.08"
                                    stroke="#7F00FF"
                                    strokeWidth="1.5"
                                    opacity="0.6"
                                />
                                <ellipse
                                    cx="110"
                                    cy="40"
                                    rx="22"
                                    ry="11"
                                    fill="#7F00FF"
                                    fillOpacity="0.08"
                                    stroke="#7F00FF"
                                    strokeWidth="1.5"
                                    opacity="0.5"
                                />
                                <ellipse
                                    cx="70"
                                    cy="45"
                                    rx="18"
                                    ry="9"
                                    fill="#7F00FF"
                                    fillOpacity="0.06"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                    opacity="0.4"
                                />
                                <ellipse
                                    cx="100"
                                    cy="47"
                                    rx="20"
                                    ry="8"
                                    fill="#7F00FF"
                                    fillOpacity="0.06"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                    opacity="0.4"
                                />
                            </motion.g>

                            <motion.g
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ x: -160, opacity: [0, 0.6, 0.6, 0] }}
                                transition={{
                                    duration: 15,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 3,
                                }}
                            >
                                {/* Cloud 2 - Larger puffy cloud */}
                                <ellipse
                                    cx="320"
                                    cy="60"
                                    rx="30"
                                    ry="14"
                                    fill="#7F00FF"
                                    fillOpacity="0.1"
                                    stroke="#7F00FF"
                                    strokeWidth="1.5"
                                    opacity="0.7"
                                />
                                <ellipse
                                    cx="340"
                                    cy="55"
                                    rx="28"
                                    ry="13"
                                    fill="#7F00FF"
                                    fillOpacity="0.1"
                                    stroke="#7F00FF"
                                    strokeWidth="1.5"
                                    opacity="0.65"
                                />
                                <ellipse
                                    cx="360"
                                    cy="60"
                                    rx="25"
                                    ry="12"
                                    fill="#7F00FF"
                                    fillOpacity="0.09"
                                    stroke="#7F00FF"
                                    strokeWidth="1.5"
                                    opacity="0.6"
                                />
                                <ellipse
                                    cx="310"
                                    cy="65"
                                    rx="22"
                                    ry="10"
                                    fill="#7F00FF"
                                    fillOpacity="0.07"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                    opacity="0.45"
                                />
                                <ellipse
                                    cx="345"
                                    cy="68"
                                    rx="24"
                                    ry="9"
                                    fill="#7F00FF"
                                    fillOpacity="0.07"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                    opacity="0.45"
                                />
                            </motion.g>

                            <motion.g
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ x: -180, opacity: [0, 0.55, 0.55, 0] }}
                                transition={{
                                    duration: 14,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 1.5,
                                }}
                            >
                                {/* Cloud 3 - Lower atmospheric cloud */}
                                <ellipse
                                    cx="200"
                                    cy="220"
                                    rx="35"
                                    ry="13"
                                    fill="#7F00FF"
                                    fillOpacity="0.12"
                                    stroke="#7F00FF"
                                    strokeWidth="2"
                                    opacity="0.65"
                                />
                                <ellipse
                                    cx="225"
                                    cy="215"
                                    rx="32"
                                    ry="12"
                                    fill="#7F00FF"
                                    fillOpacity="0.12"
                                    stroke="#7F00FF"
                                    strokeWidth="2"
                                    opacity="0.6"
                                />
                                <ellipse
                                    cx="250"
                                    cy="220"
                                    rx="28"
                                    ry="11"
                                    fill="#7F00FF"
                                    fillOpacity="0.1"
                                    stroke="#7F00FF"
                                    strokeWidth="1.5"
                                    opacity="0.55"
                                />
                                <ellipse
                                    cx="185"
                                    cy="225"
                                    rx="25"
                                    ry="10"
                                    fill="#7F00FF"
                                    fillOpacity="0.08"
                                    stroke="#7F00FF"
                                    strokeWidth="1.5"
                                    opacity="0.5"
                                />
                                <ellipse
                                    cx="220"
                                    cy="228"
                                    rx="30"
                                    ry="9"
                                    fill="#7F00FF"
                                    fillOpacity="0.08"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                    opacity="0.45"
                                />
                            </motion.g>

                            <motion.g
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ x: -130, opacity: [0, 0.45, 0.45, 0] }}
                                transition={{
                                    duration: 11,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 5,
                                }}
                            >
                                {/* Cloud 4 - Small wispy cloud */}
                                <ellipse
                                    cx="150"
                                    cy="90"
                                    rx="20"
                                    ry="8"
                                    fill="#7F00FF"
                                    fillOpacity="0.06"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                    opacity="0.5"
                                />
                                <ellipse
                                    cx="165"
                                    cy="87"
                                    rx="18"
                                    ry="7"
                                    fill="#7F00FF"
                                    fillOpacity="0.06"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                    opacity="0.45"
                                />
                                <ellipse
                                    cx="180"
                                    cy="90"
                                    rx="16"
                                    ry="7"
                                    fill="#7F00FF"
                                    fillOpacity="0.05"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                    opacity="0.4"
                                />
                            </motion.g>

                            {/* 3D Perspective Commercial Aircraft */}
                            <motion.g
                                initial={{ y: 0 }}
                                animate={{ y: [0, 8, 0] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    repeatDelay: 0,
                                }}
                            >
                                {/* Fuselage - 3D perspective view with rounded tail */}
                                <motion.path
                                    d="M 120 110 Q 100 105 85 115 Q 70 125 70 140 Q 70 155 85 165 Q 100 175 120 170 L 260 155 Q 290 152 305 148 Q 315 145 315 140 Q 315 135 305 132 Q 290 128 260 125 L 120 110 Z"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.2, delay: 0.3 }}
                                    filter="url(#glowAero)"
                                    strokeWidth="2"
                                />

                                {/* Cockpit windshield */}
                                <motion.path
                                    d="M 90 120 Q 80 130 80 140 Q 80 150 90 160"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 1 }}
                                    strokeWidth="1.5"
                                />
                                <motion.path
                                    d="M 85 128 L 95 125 L 95 135"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 1.2 }}
                                    strokeWidth="1"
                                />
                                <motion.path
                                    d="M 85 152 L 95 155 L 95 145"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 1.3 }}
                                    strokeWidth="1"
                                />

                                {/* Cabin windows - perspective row */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.4 }}
                                >
                                    <ellipse
                                        cx="115"
                                        cy="135"
                                        rx="4"
                                        ry="3"
                                        strokeWidth="1"
                                    />
                                    <ellipse
                                        cx="130"
                                        cy="133"
                                        rx="4"
                                        ry="3"
                                        strokeWidth="1"
                                    />
                                    <ellipse
                                        cx="145"
                                        cy="132"
                                        rx="4"
                                        ry="3"
                                        strokeWidth="1"
                                    />
                                    <ellipse
                                        cx="160"
                                        cy="131"
                                        rx="4"
                                        ry="3"
                                        strokeWidth="1"
                                    />
                                    <ellipse
                                        cx="175"
                                        cy="130"
                                        rx="3"
                                        ry="2.5"
                                        strokeWidth="1"
                                    />
                                    <ellipse
                                        cx="190"
                                        cy="129"
                                        rx="3"
                                        ry="2.5"
                                        strokeWidth="1"
                                    />
                                    <ellipse
                                        cx="205"
                                        cy="129"
                                        rx="3"
                                        ry="2"
                                        strokeWidth="1"
                                    />
                                    <ellipse
                                        cx="220"
                                        cy="129"
                                        rx="3"
                                        ry="2"
                                        strokeWidth="1"
                                    />
                                </motion.g>

                                {/* Left wing - coming toward viewer */}
                                <motion.path
                                    d="M 140 160 L 60 205 L 40 215 Q 35 217 38 213 L 55 195 L 130 155"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 1.6 }}
                                    filter="url(#glowAero)"
                                    strokeWidth="2"
                                />

                                {/* Right wing - going away */}
                                <motion.path
                                    d="M 170 120 L 270 80 L 310 65 Q 315 63 312 68 L 280 85 L 180 125"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 1.8 }}
                                    filter="url(#glowAero)"
                                    strokeWidth="2"
                                />

                                {/* Tail fin - rounded top */}
                                <motion.path
                                    d="M 265 135 Q 275 115 285 105 Q 290 100 295 105 Q 298 110 295 120 L 285 138"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 2 }}
                                    filter="url(#glowAero)"
                                    strokeWidth="2"
                                />

                                {/* Horizontal stabilizer left */}
                                <motion.path
                                    d="M 270 148 L 252 165 L 248 163 L 262 148"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 2.2 }}
                                    strokeWidth="1.5"
                                />

                                {/* Horizontal stabilizer right */}
                                <motion.path
                                    d="M 275 130 L 295 115 L 298 118 L 280 132"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 2.3 }}
                                    strokeWidth="1.5"
                                />

                                {/* Left engine - under left wing */}
                                <motion.ellipse
                                    cx="85"
                                    cy="198"
                                    rx="12"
                                    ry="8"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.4 }}
                                    filter="url(#glowAero)"
                                    strokeWidth="2"
                                />
                                <motion.ellipse
                                    cx="85"
                                    cy="198"
                                    rx="8"
                                    ry="5"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 2.5 }}
                                    strokeWidth="1"
                                />
                                <motion.g
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 0.15,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                    style={{
                                        transformOrigin: `85px 198px`,
                                        transformBox: 'fill-box',
                                    }}
                                >
                                    <line
                                        x1="85"
                                        y1="190"
                                        x2="85"
                                        y2="206"
                                        strokeWidth="1.5"
                                        stroke="#7F00FF"
                                    />
                                    <line
                                        x1="77"
                                        y1="198"
                                        x2="93"
                                        y2="198"
                                        strokeWidth="1.5"
                                        stroke="#7F00FF"
                                    />
                                </motion.g>

                                {/* Right engine - under right wing */}
                                <motion.ellipse
                                    cx="250"
                                    cy="85"
                                    rx="10"
                                    ry="6"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.6 }}
                                    filter="url(#glowAero)"
                                    strokeWidth="2"
                                />
                                <motion.ellipse
                                    cx="250"
                                    cy="85"
                                    rx="6"
                                    ry="4"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 2.7 }}
                                    strokeWidth="1"
                                />
                                <motion.g
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 0.15,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                    style={{
                                        transformOrigin: `250px 85px`,
                                        transformBox: 'fill-box',
                                    }}
                                >
                                    <line
                                        x1="250"
                                        y1="79"
                                        x2="250"
                                        y2="91"
                                        strokeWidth="1"
                                        stroke="#7F00FF"
                                    />
                                    <line
                                        x1="244"
                                        y1="85"
                                        x2="256"
                                        y2="85"
                                        strokeWidth="1"
                                        stroke="#7F00FF"
                                    />
                                </motion.g>

                                {/* Nose light */}
                                <motion.circle
                                    cx="75"
                                    cy="140"
                                    r="3"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    fill="#7F00FF"
                                    filter="url(#glowAero)"
                                />

                                {/* Wing tip lights */}
                                <motion.circle
                                    cx="40"
                                    cy="213"
                                    r="2"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: 0.5,
                                    }}
                                    fill="#7F00FF"
                                />
                                <motion.circle
                                    cx="310"
                                    cy="66"
                                    r="2"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    fill="#7F00FF"
                                />

                                {/* Tail light */}
                                <motion.circle
                                    cx="295"
                                    cy="110"
                                    r="2"
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        delay: 0.3,
                                    }}
                                    fill="#7F00FF"
                                />
                            </motion.g>
                        </svg>

                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#7F00FF]/20 to-transparent" />
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
