'use client';

import { motion } from 'framer-motion';

export function SoftwareDisplay() {
    return (
        <div className="w-full h-full p-2">
            <div className="relative bg-[#0f0f0f] rounded-lg overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0">
                    <svg width="100%" height="100%" className="opacity-10">
                        <defs>
                            <pattern
                                id="smallGridSoftware"
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
                                id="gridSoftware"
                                width="100"
                                height="100"
                                patternUnits="userSpaceOnUse"
                            >
                                <rect
                                    width="100"
                                    height="100"
                                    fill="url(#smallGridSoftware)"
                                />
                                <path
                                    d="M 100 0 L 0 0 0 100"
                                    fill="none"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridSoftware)" />
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
                                Software
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
                                <filter id="glowSoftware">
                                    <feGaussianBlur
                                        stdDeviation="3"
                                        result="coloredBlur"
                                    />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Terminal/Code Editor Window */}
                            <motion.g>
                                {/* Window frame */}
                                <motion.rect
                                    x="80"
                                    y="50"
                                    width="240"
                                    height="180"
                                    rx="8"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    strokeWidth="2"
                                    filter="url(#glowSoftware)"
                                />

                                {/* Title bar */}
                                <motion.line
                                    x1="80"
                                    y1="75"
                                    x2="320"
                                    y2="75"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: 0.6 }}
                                    strokeWidth="1.5"
                                />

                                {/* Window buttons */}
                                <motion.circle
                                    cx="100"
                                    cy="62"
                                    r="5"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.8 }}
                                    strokeWidth="1.5"
                                />
                                <motion.circle
                                    cx="118"
                                    cy="62"
                                    r="5"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.9 }}
                                    strokeWidth="1.5"
                                />
                                <motion.circle
                                    cx="136"
                                    cy="62"
                                    r="5"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1 }}
                                    strokeWidth="1.5"
                                />

                                {/* Code lines with continuous typing animation */}
                                <motion.g>
                                    {/* Line 1: function declaration */}
                                    <motion.path
                                        d="M 95 95 L 105 100 L 95 105"
                                        animate={{
                                            pathLength: [0, 1, 1, 0],
                                            opacity: [0, 1, 1, 0],
                                        }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.1, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                    />
                                    <motion.line
                                        x1="115"
                                        y1="100"
                                        x2="180"
                                        y2="100"
                                        animate={{ pathLength: [0, 0, 1, 1, 0] }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.05, 0.15, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                    />
                                    <motion.line
                                        x1="185"
                                        y1="100"
                                        x2="220"
                                        y2="100"
                                        animate={{ pathLength: [0, 0, 1, 1, 0] }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.1, 0.2, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                    />

                                    {/* Line 2 */}
                                    <motion.line
                                        x1="105"
                                        y1="120"
                                        x2="140"
                                        y2="120"
                                        animate={{ pathLength: [0, 0, 1, 1, 0] }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.15, 0.25, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                    />
                                    <motion.line
                                        x1="145"
                                        y1="120"
                                        x2="200"
                                        y2="120"
                                        animate={{ pathLength: [0, 0, 1, 1, 0] }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.2, 0.3, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                    />

                                    {/* Line 3 */}
                                    <motion.line
                                        x1="105"
                                        y1="140"
                                        x2="170"
                                        y2="140"
                                        animate={{ pathLength: [0, 0, 1, 1, 0] }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.25, 0.35, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                    />
                                    <motion.line
                                        x1="175"
                                        y1="140"
                                        x2="250"
                                        y2="140"
                                        animate={{ pathLength: [0, 0, 1, 1, 0] }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.3, 0.4, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                    />

                                    {/* Line 4 */}
                                    <motion.line
                                        x1="105"
                                        y1="160"
                                        x2="160"
                                        y2="160"
                                        animate={{ pathLength: [0, 0, 1, 1, 0] }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.35, 0.45, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                    />
                                    <motion.line
                                        x1="165"
                                        y1="160"
                                        x2="230"
                                        y2="160"
                                        animate={{ pathLength: [0, 0, 1, 1, 0] }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.4, 0.5, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                    />

                                    {/* Line 5: closing bracket */}
                                    <motion.path
                                        d="M 105 180 L 95 185 L 105 190"
                                        animate={{
                                            pathLength: [0, 0, 1, 1, 0],
                                            opacity: [0, 0, 1, 1, 0],
                                        }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            times: [0, 0.5, 0.6, 0.8, 1],
                                        }}
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                    />

                                    {/* Typing cursor that moves with the code */}
                                    <motion.line
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="10"
                                        animate={{
                                            x: [
                                                115, 180, 220, 140, 200, 170, 250, 160,
                                                230, 105, 115,
                                            ],
                                            y: [
                                                95, 95, 95, 115, 115, 135, 135, 155, 155,
                                                175, 95,
                                            ],
                                            opacity: [1, 0, 1],
                                        }}
                                        transition={{
                                            x: {
                                                duration: 6,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35,
                                                    0.4, 0.45, 0.55, 1,
                                                ],
                                            },
                                            y: {
                                                duration: 6,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35,
                                                    0.4, 0.45, 0.55, 1,
                                                ],
                                            },
                                            opacity: { duration: 0.5, repeat: Infinity },
                                        }}
                                        strokeWidth="2"
                                        stroke="#7F00FF"
                                    />
                                </motion.g>

                                {/* Scrollbar */}
                                <motion.rect
                                    x="305"
                                    y="85"
                                    width="6"
                                    height="135"
                                    rx="3"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.3 }}
                                    transition={{ delay: 1.5 }}
                                    strokeWidth="1"
                                />
                                <motion.rect
                                    x="305"
                                    y="90"
                                    width="6"
                                    height="40"
                                    rx="3"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.6, y: [0, 50, 0] }}
                                    transition={{
                                        delay: 1.5,
                                        duration: 4,
                                        repeat: Infinity,
                                    }}
                                    fill="#7F00FF"
                                    strokeWidth="0"
                                />
                            </motion.g>

                            {/* Floating binary numbers */}
                            <motion.g opacity="0.4">
                                <motion.text
                                    x="50"
                                    y="80"
                                    fontSize="12"
                                    fill="#7F00FF"
                                    stroke="none"
                                    animate={{
                                        y: [80, 60, 80],
                                        opacity: [0.2, 0.5, 0.2],
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    01
                                </motion.text>
                                <motion.text
                                    x="340"
                                    y="120"
                                    fontSize="12"
                                    fill="#7F00FF"
                                    stroke="none"
                                    animate={{
                                        y: [120, 100, 120],
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        delay: 0.5,
                                    }}
                                >
                                    10
                                </motion.text>
                                <motion.text
                                    x="55"
                                    y="180"
                                    fontSize="12"
                                    fill="#7F00FF"
                                    stroke="none"
                                    animate={{
                                        y: [180, 160, 180],
                                        opacity: [0.2, 0.5, 0.2],
                                    }}
                                    transition={{
                                        duration: 2.8,
                                        repeat: Infinity,
                                        delay: 1,
                                    }}
                                >
                                    11
                                </motion.text>
                                <motion.text
                                    x="340"
                                    y="200"
                                    fontSize="12"
                                    fill="#7F00FF"
                                    stroke="none"
                                    animate={{
                                        y: [200, 180, 200],
                                        opacity: [0.3, 0.5, 0.3],
                                    }}
                                    transition={{
                                        duration: 3.2,
                                        repeat: Infinity,
                                        delay: 0.3,
                                    }}
                                >
                                    01
                                </motion.text>
                            </motion.g>

                            {/* Code brackets decoration */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 2.8 }}
                            >
                                {/* Left curly brace */}
                                <motion.path
                                    d="M 50 120 Q 40 120 40 130 L 40 145 Q 40 155 30 155 Q 40 155 40 165 L 40 180 Q 40 190 50 190"
                                    strokeWidth="2"
                                    animate={{ pathLength: [0, 1, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                            </motion.g>

                            {/* Connection nodes / API endpoints */}
                            <motion.g>
                                <motion.circle
                                    cx="350"
                                    cy="70"
                                    r="7"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: 3,
                                    }}
                                    strokeWidth="2"
                                />
                                <motion.circle
                                    cx="350"
                                    cy="70"
                                    r="3"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    fill="#7F00FF"
                                    strokeWidth="0"
                                />
                                <motion.line
                                    x1="320"
                                    y1="62"
                                    x2="343"
                                    y2="70"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: 2.5 }}
                                    strokeWidth="1.5"
                                    strokeDasharray="4 2"
                                />
                            </motion.g>

                            {/* Gear/settings icon */}
                            <motion.g
                                animate={{ rotate: 360 }}
                                transition={{
                                    duration: 8,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                                style={{
                                    transformOrigin: `55px 240px`,
                                    transformBox: 'fill-box',
                                }}
                            >
                                <motion.circle
                                    cx="55"
                                    cy="240"
                                    r="10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    transition={{ delay: 3 }}
                                    strokeWidth="2"
                                />
                                <motion.circle
                                    cx="55"
                                    cy="240"
                                    r="4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    transition={{ delay: 3 }}
                                    strokeWidth="2"
                                />
                                <motion.line
                                    x1="55"
                                    y1="227"
                                    x2="55"
                                    y2="232"
                                    strokeWidth="3"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    transition={{ delay: 3 }}
                                />
                                <motion.line
                                    x1="55"
                                    y1="248"
                                    x2="55"
                                    y2="253"
                                    strokeWidth="3"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    transition={{ delay: 3 }}
                                />
                                <motion.line
                                    x1="42"
                                    y1="240"
                                    x2="47"
                                    y2="240"
                                    strokeWidth="3"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    transition={{ delay: 3 }}
                                />
                                <motion.line
                                    x1="63"
                                    y1="240"
                                    x2="68"
                                    y2="240"
                                    strokeWidth="3"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    transition={{ delay: 3 }}
                                />
                            </motion.g>

                            {/* Cloud symbol */}
                            <motion.path
                                d="M 330 235 Q 320 225 330 215 Q 343 205 355 215 Q 368 210 372 222 Q 380 227 376 240 L 325 240 Q 318 240 322 232 Z"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.4 }}
                                transition={{ duration: 1, delay: 3.2 }}
                                strokeWidth="2"
                            />

                            {/* Upload arrow in cloud */}
                            <motion.path
                                d="M 350 238 L 350 225 M 345 230 L 350 225 L 355 230"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.3, 0.7, 0.3], y: [0, -3, 0] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: 3.5,
                                }}
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
