'use client';

import { motion } from 'framer-motion';

export function HealthcareDisplay() {
    return (
        <div className="w-full h-full p-2">
            <div className="relative bg-[#0f0f0f] rounded-lg overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0">
                    <svg width="100%" height="100%" className="opacity-10">
                        <defs>
                            <pattern
                                id="smallGridHealth"
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
                                id="gridHealth"
                                width="100"
                                height="100"
                                patternUnits="userSpaceOnUse"
                            >
                                <rect
                                    width="100"
                                    height="100"
                                    fill="url(#smallGridHealth)"
                                />
                                <path
                                    d="M 100 0 L 0 0 0 100"
                                    fill="none"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridHealth)" />
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
                                Healthcare
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
                                <filter id="glowHealth">
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
                                    id="tubeGradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#7F00FF"
                                        stopOpacity="1"
                                    />
                                    <stop
                                        offset="50%"
                                        stopColor="#7F00FF"
                                        stopOpacity="0.8"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#7F00FF"
                                        stopOpacity="1"
                                    />
                                </linearGradient>
                            </defs>

                            {/* Enhanced Stethoscope with realistic 3D look */}
                            <motion.g>
                                {/* Left ear tube - thicker and more realistic */}
                                <motion.path
                                    d="M 150 45 Q 150 65 165 82 Q 180 99 195 118"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                    strokeWidth="5"
                                    stroke="url(#tubeGradient)"
                                    filter="url(#glowHealth)"
                                />
                                {/* Tube highlight for 3D effect */}
                                <motion.path
                                    d="M 150 45 Q 150 65 165 82 Q 180 99 195 118"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.6 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    strokeWidth="2"
                                    stroke="#7F00FF"
                                />

                                {/* Right ear tube - thicker and more realistic */}
                                <motion.path
                                    d="M 250 45 Q 250 65 235 82 Q 220 99 205 118"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                    strokeWidth="5"
                                    stroke="url(#tubeGradient)"
                                    filter="url(#glowHealth)"
                                />
                                {/* Tube highlight for 3D effect */}
                                <motion.path
                                    d="M 250 45 Q 250 65 235 82 Q 220 99 205 118"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.6 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    strokeWidth="2"
                                    stroke="#7F00FF"
                                />

                                {/* Left ear tip - more detailed */}
                                <motion.g
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 0.8 }}
                                >
                                    <circle
                                        cx="150"
                                        cy="40"
                                        r="10"
                                        strokeWidth="3"
                                        fill="#7F00FF"
                                        fillOpacity="0.2"
                                        filter="url(#glowHealth)"
                                    />
                                    <circle
                                        cx="150"
                                        cy="40"
                                        r="6"
                                        strokeWidth="2"
                                        fill="none"
                                    />
                                    <circle
                                        cx="148"
                                        cy="38"
                                        r="3"
                                        fill="#7F00FF"
                                        fillOpacity="0.5"
                                        stroke="none"
                                    />
                                </motion.g>

                                {/* Right ear tip - more detailed */}
                                <motion.g
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 0.8 }}
                                >
                                    <circle
                                        cx="250"
                                        cy="40"
                                        r="10"
                                        strokeWidth="3"
                                        fill="#7F00FF"
                                        fillOpacity="0.2"
                                        filter="url(#glowHealth)"
                                    />
                                    <circle
                                        cx="250"
                                        cy="40"
                                        r="6"
                                        strokeWidth="2"
                                        fill="none"
                                    />
                                    <circle
                                        cx="248"
                                        cy="38"
                                        r="3"
                                        fill="#7F00FF"
                                        fillOpacity="0.5"
                                        stroke="none"
                                    />
                                </motion.g>

                                {/* Main tube going down - thicker with highlight */}
                                <motion.path
                                    d="M 200 118 L 200 155 Q 200 175 182 190 Q 165 205 165 225"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.9, delay: 0.6 }}
                                    strokeWidth="5"
                                    stroke="url(#tubeGradient)"
                                    filter="url(#glowHealth)"
                                />
                                <motion.path
                                    d="M 200 118 L 200 155 Q 200 175 182 190 Q 165 205 165 225"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.6 }}
                                    transition={{ duration: 0.9, delay: 0.7 }}
                                    strokeWidth="2"
                                    stroke="#7F00FF"
                                />

                                {/* Chest piece - enhanced 3D diaphragm */}
                                <motion.g
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 1.2 }}
                                >
                                    {/* Outer ring - metallic look */}
                                    <circle
                                        cx="165"
                                        cy="250"
                                        r="30"
                                        strokeWidth="4"
                                        fill="#7F00FF"
                                        fillOpacity="0.15"
                                        filter="url(#glowHealth)"
                                    />
                                    {/* Middle ring */}
                                    <circle
                                        cx="165"
                                        cy="250"
                                        r="24"
                                        strokeWidth="2.5"
                                        fill="none"
                                    />
                                    {/* Inner membrane */}
                                    <circle
                                        cx="165"
                                        cy="250"
                                        r="18"
                                        strokeWidth="2"
                                        fill="#7F00FF"
                                        fillOpacity="0.1"
                                    />
                                    {/* Center detail */}
                                    <circle
                                        cx="165"
                                        cy="250"
                                        r="10"
                                        strokeWidth="1.5"
                                        fill="none"
                                    />
                                    {/* Diaphragm lines */}
                                    <line
                                        x1="165"
                                        y1="240"
                                        x2="165"
                                        y2="260"
                                        strokeWidth="1"
                                        opacity="0.6"
                                    />
                                    <line
                                        x1="155"
                                        y1="250"
                                        x2="175"
                                        y2="250"
                                        strokeWidth="1"
                                        opacity="0.6"
                                    />
                                    {/* Highlight for metallic effect */}
                                    <motion.path
                                        d="M 150 240 Q 165 235 180 240"
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                        opacity="0.5"
                                    />
                                </motion.g>

                                {/* Animated sound waves from chest piece */}
                                <motion.g>
                                    <motion.circle
                                        cx="165"
                                        cy="250"
                                        r="30"
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                        fill="none"
                                        animate={{
                                            scale: [1, 1.4, 1.8],
                                            opacity: [0.6, 0.3, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeOut',
                                        }}
                                    />
                                    <motion.circle
                                        cx="165"
                                        cy="250"
                                        r="30"
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                        fill="none"
                                        animate={{
                                            scale: [1, 1.4, 1.8],
                                            opacity: [0.6, 0.3, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeOut',
                                            delay: 0.7,
                                        }}
                                    />
                                </motion.g>
                            </motion.g>

                            {/* Animated heartbeat with realistic ECG */}
                            <motion.g>
                                {/* ECG monitor frame */}
                                <motion.rect
                                    x="240"
                                    y="90"
                                    width="140"
                                    height="80"
                                    rx="4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.6 }}
                                    transition={{ delay: 1.5 }}
                                    strokeWidth="2"
                                    fill="#7F00FF"
                                    fillOpacity="0.05"
                                />

                                {/* ECG grid lines */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.2 }}
                                    transition={{ delay: 1.6 }}
                                >
                                    <line
                                        x1="260"
                                        y1="90"
                                        x2="260"
                                        y2="170"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="280"
                                        y1="90"
                                        x2="280"
                                        y2="170"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="300"
                                        y1="90"
                                        x2="300"
                                        y2="170"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="320"
                                        y1="90"
                                        x2="320"
                                        y2="170"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="340"
                                        y1="90"
                                        x2="340"
                                        y2="170"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="360"
                                        y1="90"
                                        x2="360"
                                        y2="170"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="240"
                                        y1="110"
                                        x2="380"
                                        y2="110"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="240"
                                        y1="130"
                                        x2="380"
                                        y2="130"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="240"
                                        y1="150"
                                        x2="380"
                                        y2="150"
                                        strokeWidth="0.5"
                                    />
                                </motion.g>

                                {/* Realistic ECG wave */}
                                <motion.path
                                    d="M 245 130 L 255 130 L 260 130 L 263 125 L 266 135 L 268 127 L 270 130 L 285 130 L 290 130 L 295 105 L 300 155 L 305 130 L 315 130 L 320 130 L 323 125 L 326 135 L 328 127 L 330 130 L 345 130 L 350 130 L 355 105 L 360 155 L 365 130 L 375 130"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{
                                        duration: 2,
                                        delay: 1.8,
                                        repeat: Infinity,
                                        repeatDelay: 0.5,
                                    }}
                                    strokeWidth="2.5"
                                    stroke="#7F00FF"
                                    filter="url(#glowHealth)"
                                />

                                {/* BPM indicator */}
                                <motion.text
                                    x="250"
                                    y="108"
                                    fontSize="12"
                                    fill="#7F00FF"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    72 BPM
                                </motion.text>
                            </motion.g>

                            {/* Pulsing heart icon */}
                            <motion.g
                                animate={{
                                    scale: [1, 1.15, 1],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <motion.path
                                    d="M 200 210 Q 185 195 185 180 Q 185 165 200 165 Q 215 165 215 180 Q 215 195 200 210 Z M 200 165 Q 215 150 230 150 Q 245 150 245 165 Q 245 180 230 195 L 200 210"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.7 }}
                                    transition={{ duration: 1, delay: 2 }}
                                    strokeWidth="2"
                                    fill="#7F00FF"
                                    fillOpacity="0.2"
                                    filter="url(#glowHealth)"
                                />
                            </motion.g>

                            {/* Medical cross with pulse */}
                            <motion.g
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <motion.path
                                    d="M 335 215 L 335 245 M 320 230 L 350 230"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.2 }}
                                    strokeWidth="5"
                                    stroke="#7F00FF"
                                    strokeLinecap="round"
                                    filter="url(#glowHealth)"
                                />
                            </motion.g>

                            {/* Floating vital signs indicators */}
                            <motion.g
                                animate={{ y: [-2, 2, -2] }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <motion.circle
                                    cx="80"
                                    cy="120"
                                    r="8"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, opacity: 0.6 }}
                                    transition={{ delay: 2.5 }}
                                    strokeWidth="2"
                                    fill="#7F00FF"
                                    fillOpacity="0.1"
                                />
                                <motion.text
                                    x="76"
                                    y="124"
                                    fontSize="10"
                                    fill="#7F00FF"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.8 }}
                                    transition={{ delay: 2.6 }}
                                >
                                    O₂
                                </motion.text>
                            </motion.g>

                            {/* Blood pressure indicator */}
                            <motion.g
                                animate={{ y: [2, -2, 2] }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: 0.5,
                                }}
                            >
                                <motion.circle
                                    cx="80"
                                    cy="180"
                                    r="8"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, opacity: 0.6 }}
                                    transition={{ delay: 2.7 }}
                                    strokeWidth="2"
                                    fill="#7F00FF"
                                    fillOpacity="0.1"
                                />
                                <motion.text
                                    x="75"
                                    y="184"
                                    fontSize="10"
                                    fill="#7F00FF"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.8 }}
                                    transition={{ delay: 2.8 }}
                                >
                                    BP
                                </motion.text>
                            </motion.g>
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
