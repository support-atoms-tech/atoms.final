'use client';

import { motion } from 'framer-motion';

export function RailwayDisplay() {
    return (
        <div className="w-full h-full p-2">
            <div className="relative bg-[#0f0f0f] rounded-lg overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0">
                    <svg width="100%" height="100%" className="opacity-10">
                        <defs>
                            <pattern
                                id="smallGridRail"
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
                                id="gridRail"
                                width="100"
                                height="100"
                                patternUnits="userSpaceOnUse"
                            >
                                <rect
                                    width="100"
                                    height="100"
                                    fill="url(#smallGridRail)"
                                />
                                <path
                                    d="M 100 0 L 0 0 0 100"
                                    fill="none"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridRail)" />
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
                                Railways
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
                            viewBox="0 0 500 200"
                            className="w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                            fill="none"
                            stroke="#7F00FF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <defs>
                                <filter id="glowRail">
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

                            {/* Speed lines behind the train */}
                            <motion.line
                                x1="25"
                                y1="75"
                                x2="5"
                                y2="75"
                                stroke="#7F00FF"
                                strokeWidth="2"
                                initial={{ x: 0, opacity: 0.8 }}
                                animate={{ x: -30, opacity: 0 }}
                                transition={{
                                    duration: 0.3,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 0,
                                }}
                            />
                            <motion.line
                                x1="28"
                                y1="95"
                                x2="8"
                                y2="95"
                                stroke="#7F00FF"
                                strokeWidth="2"
                                initial={{ x: 0, opacity: 0.8 }}
                                animate={{ x: -35, opacity: 0 }}
                                transition={{
                                    duration: 0.3,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 0.1,
                                }}
                            />
                            <motion.line
                                x1="25"
                                y1="115"
                                x2="5"
                                y2="115"
                                stroke="#7F00FF"
                                strokeWidth="2"
                                initial={{ x: 0, opacity: 0.8 }}
                                animate={{ x: -30, opacity: 0 }}
                                transition={{
                                    duration: 0.3,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 0.2,
                                }}
                            />

                            {/* High-Speed Train - Sleek TGV/Shinkansen Style */}
                            <motion.g
                                animate={{ x: [-1, 1, -1] }}
                                transition={{
                                    duration: 0.1,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                {/* Main body - rear carriage (rectangular) */}
                                <motion.path
                                    d="M 35 55 L 35 125 L 200 125 L 200 55 Z"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                    filter="url(#glowRail)"
                                    strokeWidth="2"
                                />

                                {/* Middle section connecting to nose */}
                                <motion.path
                                    d="M 200 55 L 200 125 L 320 125 L 320 55 Z"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                    filter="url(#glowRail)"
                                    strokeWidth="2"
                                />

                                {/* Front nose - sleek elongated aerodynamic shape (like a beak/arrow) */}
                                <motion.path
                                    d="M 320 55 L 320 125 L 380 128 L 420 130 Q 450 130 470 120 Q 485 108 490 95 Q 485 82 470 70 Q 450 60 420 60 L 380 62 L 320 55"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 0.7 }}
                                    filter="url(#glowRail)"
                                    strokeWidth="2"
                                />

                                {/* Windshield - angular front window */}
                                <motion.path
                                    d="M 400 65 L 430 68 Q 460 75 475 95 Q 460 115 430 122 L 400 125"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 1 }}
                                    strokeWidth="1.5"
                                />

                                {/* Windshield center divider */}
                                <motion.line
                                    x1="400"
                                    y1="65"
                                    x2="475"
                                    y2="95"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.6 }}
                                    transition={{ duration: 0.3, delay: 1.1 }}
                                    strokeWidth="1"
                                />
                                <motion.line
                                    x1="400"
                                    y1="125"
                                    x2="475"
                                    y2="95"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.6 }}
                                    transition={{ duration: 0.3, delay: 1.1 }}
                                    strokeWidth="1"
                                />

                                {/* Window band line on body */}
                                <motion.line
                                    x1="40"
                                    y1="80"
                                    x2="320"
                                    y2="80"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.5 }}
                                    transition={{ duration: 0.5, delay: 1.2 }}
                                    strokeWidth="1"
                                />

                                {/* Passenger windows - first carriage */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.3 }}
                                >
                                    <rect
                                        x="50"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x="75"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x="100"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x="125"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x="150"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x="175"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                </motion.g>

                                {/* Door */}
                                <motion.rect
                                    x="195"
                                    y="70"
                                    width="12"
                                    height="50"
                                    rx="2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.4 }}
                                    strokeWidth="1.5"
                                />

                                {/* Passenger windows - second carriage (locomotive) */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5 }}
                                >
                                    <rect
                                        x="220"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x="245"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x="270"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x="295"
                                        y="65"
                                        width="18"
                                        height="28"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                </motion.g>

                                {/* Side windows on nose section */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.6 }}
                                >
                                    <rect
                                        x="335"
                                        y="70"
                                        width="15"
                                        height="20"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x="358"
                                        y="72"
                                        width="15"
                                        height="18"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                </motion.g>

                                {/* Wheel bogies */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.7 }}
                                >
                                    {/* Front bogie */}
                                    <rect
                                        x="360"
                                        y="130"
                                        width="50"
                                        height="8"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 0.12,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    >
                                        <circle cx="372" cy="145" r="8" strokeWidth="2" />
                                        <line
                                            x1="372"
                                            y1="139"
                                            x2="372"
                                            y2="151"
                                            strokeWidth="1"
                                        />
                                        <line
                                            x1="366"
                                            y1="145"
                                            x2="378"
                                            y2="145"
                                            strokeWidth="1"
                                        />
                                    </motion.g>
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 0.12,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    >
                                        <circle cx="398" cy="145" r="8" strokeWidth="2" />
                                        <line
                                            x1="398"
                                            y1="139"
                                            x2="398"
                                            y2="151"
                                            strokeWidth="1"
                                        />
                                        <line
                                            x1="392"
                                            y1="145"
                                            x2="404"
                                            y2="145"
                                            strokeWidth="1"
                                        />
                                    </motion.g>

                                    {/* Middle bogie */}
                                    <rect
                                        x="160"
                                        y="130"
                                        width="50"
                                        height="8"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 0.12,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    >
                                        <circle cx="172" cy="145" r="8" strokeWidth="2" />
                                        <line
                                            x1="172"
                                            y1="139"
                                            x2="172"
                                            y2="151"
                                            strokeWidth="1"
                                        />
                                        <line
                                            x1="166"
                                            y1="145"
                                            x2="178"
                                            y2="145"
                                            strokeWidth="1"
                                        />
                                    </motion.g>
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 0.12,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    >
                                        <circle cx="198" cy="145" r="8" strokeWidth="2" />
                                        <line
                                            x1="198"
                                            y1="139"
                                            x2="198"
                                            y2="151"
                                            strokeWidth="1"
                                        />
                                        <line
                                            x1="192"
                                            y1="145"
                                            x2="204"
                                            y2="145"
                                            strokeWidth="1"
                                        />
                                    </motion.g>

                                    {/* Rear bogie */}
                                    <rect
                                        x="55"
                                        y="130"
                                        width="50"
                                        height="8"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 0.12,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    >
                                        <circle cx="67" cy="145" r="8" strokeWidth="2" />
                                        <line
                                            x1="67"
                                            y1="139"
                                            x2="67"
                                            y2="151"
                                            strokeWidth="1"
                                        />
                                        <line
                                            x1="61"
                                            y1="145"
                                            x2="73"
                                            y2="145"
                                            strokeWidth="1"
                                        />
                                    </motion.g>
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 0.12,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    >
                                        <circle cx="93" cy="145" r="8" strokeWidth="2" />
                                        <line
                                            x1="93"
                                            y1="139"
                                            x2="93"
                                            y2="151"
                                            strokeWidth="1"
                                        />
                                        <line
                                            x1="87"
                                            y1="145"
                                            x2="99"
                                            y2="145"
                                            strokeWidth="1"
                                        />
                                    </motion.g>
                                </motion.g>

                                {/* Headlight */}
                                <motion.circle
                                    cx="488"
                                    cy="95"
                                    r="4"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    fill="#7F00FF"
                                    filter="url(#glowRail)"
                                />

                                {/* Tail light */}
                                <motion.circle
                                    cx="37"
                                    cy="115"
                                    r="3"
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    fill="#7F00FF"
                                />
                            </motion.g>

                            {/* Overhead Electric Lines (Catenary System) - Reverse L structure */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.7 }}
                                transition={{ delay: 2.2 }}
                            >
                                {/* Support poles - reverse L shaped */}
                                <motion.g
                                    initial={{ x: 500 }}
                                    animate={{ x: -100 }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                >
                                    <line
                                        x1="120"
                                        y1="35"
                                        x2="120"
                                        y2="155"
                                        strokeWidth="2.5"
                                    />
                                    <line
                                        x1="120"
                                        y1="35"
                                        x2="180"
                                        y2="35"
                                        strokeWidth="2.5"
                                    />
                                    <circle cx="120" cy="155" r="4" strokeWidth="1.5" />
                                </motion.g>
                                <motion.g
                                    initial={{ x: 500 }}
                                    animate={{ x: -100 }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: 0.375,
                                    }}
                                >
                                    <line
                                        x1="240"
                                        y1="35"
                                        x2="240"
                                        y2="155"
                                        strokeWidth="2.5"
                                    />
                                    <line
                                        x1="240"
                                        y1="35"
                                        x2="300"
                                        y2="35"
                                        strokeWidth="2.5"
                                    />
                                    <circle cx="240" cy="155" r="4" strokeWidth="1.5" />
                                </motion.g>
                                <motion.g
                                    initial={{ x: 500 }}
                                    animate={{ x: -100 }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: 0.75,
                                    }}
                                >
                                    <line
                                        x1="360"
                                        y1="35"
                                        x2="360"
                                        y2="155"
                                        strokeWidth="2.5"
                                    />
                                    <line
                                        x1="360"
                                        y1="35"
                                        x2="420"
                                        y2="35"
                                        strokeWidth="2.5"
                                    />
                                    <circle cx="360" cy="155" r="4" strokeWidth="1.5" />
                                </motion.g>
                                <motion.g
                                    initial={{ x: 500 }}
                                    animate={{ x: -100 }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: 1.125,
                                    }}
                                >
                                    <line
                                        x1="480"
                                        y1="35"
                                        x2="480"
                                        y2="155"
                                        strokeWidth="2.5"
                                    />
                                    <line
                                        x1="480"
                                        y1="35"
                                        x2="540"
                                        y2="35"
                                        strokeWidth="2.5"
                                    />
                                    <circle cx="480" cy="155" r="4" strokeWidth="1.5" />
                                </motion.g>

                                {/* Main overhead wire */}
                                <line
                                    x1="0"
                                    y1="35"
                                    x2="500"
                                    y2="35"
                                    strokeWidth="1.5"
                                    opacity="0.8"
                                />

                                {/* Dropper wires connecting to train */}
                                <motion.line
                                    x1="150"
                                    y1="35"
                                    x2="150"
                                    y2="55"
                                    strokeWidth="1"
                                    opacity="0.6"
                                    initial={{ x: 500 }}
                                    animate={{ x: -100 }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="270"
                                    y1="35"
                                    x2="270"
                                    y2="55"
                                    strokeWidth="1"
                                    opacity="0.6"
                                    initial={{ x: 500 }}
                                    animate={{ x: -100 }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: 0.5,
                                    }}
                                />
                                <motion.line
                                    x1="390"
                                    y1="35"
                                    x2="390"
                                    y2="55"
                                    strokeWidth="1"
                                    opacity="0.6"
                                    initial={{ x: 500 }}
                                    animate={{ x: -100 }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: 1,
                                    }}
                                />
                            </motion.g>

                            {/* Trees moving backwards */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 2.3 }}
                            >
                                {/* Tree 1 */}
                                <motion.g
                                    initial={{ x: 500 }}
                                    animate={{ x: -150 }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                >
                                    <line
                                        x1="40"
                                        y1="130"
                                        x2="40"
                                        y2="160"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M 40 115 L 30 130 L 50 130 Z"
                                        fill="none"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M 40 105 L 28 122 L 52 122 Z"
                                        fill="none"
                                        strokeWidth="1.5"
                                    />
                                </motion.g>

                                {/* Tree 2 */}
                                <motion.g
                                    initial={{ x: 500 }}
                                    animate={{ x: -150 }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: 0.5,
                                    }}
                                >
                                    <line
                                        x1="90"
                                        y1="125"
                                        x2="90"
                                        y2="160"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M 90 110 L 78 125 L 102 125 Z"
                                        fill="none"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M 90 98 L 75 118 L 105 118 Z"
                                        fill="none"
                                        strokeWidth="1.5"
                                    />
                                </motion.g>

                                {/* Tree 3 */}
                                <motion.g
                                    initial={{ x: 500 }}
                                    animate={{ x: -150 }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: 1,
                                    }}
                                >
                                    <line
                                        x1="150"
                                        y1="135"
                                        x2="150"
                                        y2="160"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M 150 120 L 140 135 L 160 135 Z"
                                        fill="none"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M 150 112 L 138 127 L 162 127 Z"
                                        fill="none"
                                        strokeWidth="1.5"
                                    />
                                </motion.g>

                                {/* Tree 4 */}
                                <motion.g
                                    initial={{ x: 500 }}
                                    animate={{ x: -150 }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: 1.5,
                                    }}
                                >
                                    <line
                                        x1="210"
                                        y1="128"
                                        x2="210"
                                        y2="160"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M 210 113 L 198 128 L 222 128 Z"
                                        fill="none"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M 210 102 L 195 120 L 225 120 Z"
                                        fill="none"
                                        strokeWidth="1.5"
                                    />
                                </motion.g>
                            </motion.g>

                            {/* Railway tracks */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 2 }}
                            >
                                <line x1="0" y1="158" x2="500" y2="158" strokeWidth="3" />
                                <line x1="0" y1="172" x2="500" y2="172" strokeWidth="3" />

                                {/* Track ties moving backwards */}
                                <motion.line
                                    x1="15"
                                    y1="158"
                                    x2="15"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="40"
                                    y1="158"
                                    x2="40"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="65"
                                    y1="158"
                                    x2="65"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="90"
                                    y1="158"
                                    x2="90"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="115"
                                    y1="158"
                                    x2="115"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="140"
                                    y1="158"
                                    x2="140"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="165"
                                    y1="158"
                                    x2="165"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="190"
                                    y1="158"
                                    x2="190"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="215"
                                    y1="158"
                                    x2="215"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="240"
                                    y1="158"
                                    x2="240"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="265"
                                    y1="158"
                                    x2="265"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="290"
                                    y1="158"
                                    x2="290"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="315"
                                    y1="158"
                                    x2="315"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="340"
                                    y1="158"
                                    x2="340"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="365"
                                    y1="158"
                                    x2="365"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="390"
                                    y1="158"
                                    x2="390"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="415"
                                    y1="158"
                                    x2="415"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="440"
                                    y1="158"
                                    x2="440"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="465"
                                    y1="158"
                                    x2="465"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                                <motion.line
                                    x1="490"
                                    y1="158"
                                    x2="490"
                                    y2="172"
                                    strokeWidth="5"
                                    opacity="0.5"
                                    initial={{ x: 0 }}
                                    animate={{ x: -25 }}
                                    transition={{
                                        duration: 0.12,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
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
