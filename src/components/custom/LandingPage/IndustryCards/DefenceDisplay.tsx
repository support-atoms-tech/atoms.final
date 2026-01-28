'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

export function DefenceDisplay() {
    useEffect(() => {
        console.log('DefenceDisplay mounted - tank animations should be running');
    }, []);

    return (
        <div className="w-full h-full p-2">
            <div className="relative bg-[#0f0f0f] rounded-lg overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0">
                    <svg width="100%" height="100%" className="opacity-10">
                        <defs>
                            <pattern
                                id="smallGridDefence2"
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
                                id="gridDefence2"
                                width="100"
                                height="100"
                                patternUnits="userSpaceOnUse"
                            >
                                <rect
                                    width="100"
                                    height="100"
                                    fill="url(#smallGridDefence2)"
                                />
                                <path
                                    d="M 100 0 L 0 0 0 100"
                                    fill="none"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridDefence2)" />
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
                                Defense
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
                            viewBox="-10 0 420 260"
                            className="w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                            fill="none"
                            stroke="#7F00FF"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <defs>
                                <filter id="glowTank">
                                    <feGaussianBlur
                                        stdDeviation="1"
                                        result="coloredBlur"
                                    />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Entire tank with recoil animation */}
                            <motion.g
                                initial={{ x: 0, y: 0 }}
                                animate={{
                                    x: [0, 0, -12, -8, 0],
                                    y: [0, 0, -3, -2, 0],
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    repeatDelay: 2.5,
                                    times: [0, 0.1, 0.2, 0.4, 1],
                                    ease: 'easeOut',
                                }}
                            >
                                {/* 3D Isometric Tank - Lower Hull / Track Assembly */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {/* Left track - outer shape */}
                                    <motion.path
                                        d="M 50 200 L 50 175 Q 50 165 60 165 L 180 165 Q 190 165 190 175 L 190 200 Q 190 210 180 210 L 60 210 Q 50 210 50 200"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, delay: 0.3 }}
                                        strokeWidth="1.5"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Right track - outer shape (3D perspective) */}
                                    <motion.path
                                        d="M 200 185 L 200 165 Q 200 155 210 155 L 350 155 Q 360 155 360 165 L 360 185 Q 360 195 350 195 L 210 195 Q 200 195 200 185"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, delay: 0.4 }}
                                        strokeWidth="1.5"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Track link details - left */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.6 }}
                                        transition={{ delay: 0.8 }}
                                    >
                                        <path
                                            d="M 55 210 L 55 215 L 185 215 L 185 210"
                                            strokeWidth="1"
                                        />
                                        <path
                                            d="M 58 215 Q 50 215 50 205"
                                            strokeWidth="1"
                                        />
                                        <path
                                            d="M 182 215 Q 190 215 190 205"
                                            strokeWidth="1"
                                        />
                                    </motion.g>

                                    {/* Track link details - right */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.6 }}
                                        transition={{ delay: 0.9 }}
                                    >
                                        <path
                                            d="M 205 195 L 205 200 L 355 200 L 355 195"
                                            strokeWidth="1"
                                        />
                                        <path
                                            d="M 208 200 Q 200 200 200 190"
                                            strokeWidth="1"
                                        />
                                        <path
                                            d="M 352 200 Q 360 200 360 190"
                                            strokeWidth="1"
                                        />
                                    </motion.g>

                                    {/* Road wheels - left track */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 }}
                                    >
                                        <circle
                                            cx="75"
                                            cy="187"
                                            r="12"
                                            strokeWidth="1.5"
                                        />
                                        <circle cx="75" cy="187" r="6" strokeWidth="1" />
                                        <circle
                                            cx="75"
                                            cy="187"
                                            r="2"
                                            fill="#7F00FF"
                                            stroke="none"
                                        />

                                        <circle
                                            cx="110"
                                            cy="187"
                                            r="12"
                                            strokeWidth="1.5"
                                        />
                                        <circle cx="110" cy="187" r="6" strokeWidth="1" />
                                        <circle
                                            cx="110"
                                            cy="187"
                                            r="2"
                                            fill="#7F00FF"
                                            stroke="none"
                                        />

                                        <circle
                                            cx="145"
                                            cy="187"
                                            r="12"
                                            strokeWidth="1.5"
                                        />
                                        <circle cx="145" cy="187" r="6" strokeWidth="1" />
                                        <circle
                                            cx="145"
                                            cy="187"
                                            r="2"
                                            fill="#7F00FF"
                                            stroke="none"
                                        />

                                        <circle
                                            cx="175"
                                            cy="187"
                                            r="10"
                                            strokeWidth="1.5"
                                        />
                                        <circle cx="175" cy="187" r="5" strokeWidth="1" />
                                    </motion.g>

                                    {/* Road wheels - right track */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.1 }}
                                    >
                                        <circle
                                            cx="225"
                                            cy="175"
                                            r="10"
                                            strokeWidth="1.5"
                                        />
                                        <circle cx="225" cy="175" r="5" strokeWidth="1" />

                                        <circle
                                            cx="260"
                                            cy="175"
                                            r="10"
                                            strokeWidth="1.5"
                                        />
                                        <circle cx="260" cy="175" r="5" strokeWidth="1" />

                                        <circle
                                            cx="295"
                                            cy="175"
                                            r="10"
                                            strokeWidth="1.5"
                                        />
                                        <circle cx="295" cy="175" r="5" strokeWidth="1" />

                                        <circle
                                            cx="330"
                                            cy="175"
                                            r="10"
                                            strokeWidth="1.5"
                                        />
                                        <circle cx="330" cy="175" r="5" strokeWidth="1" />
                                    </motion.g>
                                </motion.g>

                                {/* Hull - Main body (3D isometric) */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.2 }}
                                >
                                    {/* Hull bottom plate */}
                                    <motion.path
                                        d="M 45 165 L 65 145 L 355 145 L 365 160"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.6, delay: 1.3 }}
                                        strokeWidth="1.5"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Hull front glacis */}
                                    <motion.path
                                        d="M 45 165 L 45 140 L 75 105 L 95 105"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 1.4 }}
                                        strokeWidth="1.5"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Hull top plate */}
                                    <motion.path
                                        d="M 75 105 L 355 105 L 365 120 L 365 145"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.6, delay: 1.5 }}
                                        strokeWidth="1.5"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Side skirts / armor panels */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.7 }}
                                        transition={{ delay: 1.7 }}
                                    >
                                        <path d="M 65 145 L 65 165" strokeWidth="1" />
                                        <path d="M 100 145 L 100 165" strokeWidth="1" />
                                        <path d="M 135 145 L 135 165" strokeWidth="1" />
                                        <path d="M 170 145 L 170 165" strokeWidth="1" />
                                        <path d="M 205 145 L 205 155" strokeWidth="1" />
                                        <path d="M 240 145 L 240 155" strokeWidth="1" />
                                        <path d="M 275 145 L 275 155" strokeWidth="1" />
                                        <path d="M 310 145 L 310 155" strokeWidth="1" />
                                        <path d="M 345 145 L 345 155" strokeWidth="1" />
                                    </motion.g>

                                    {/* Hull details - vents and hatches */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.5 }}
                                        transition={{ delay: 1.8 }}
                                    >
                                        <rect
                                            x="320"
                                            y="110"
                                            width="30"
                                            height="20"
                                            strokeWidth="1"
                                        />
                                        <line
                                            x1="325"
                                            y1="115"
                                            x2="345"
                                            y2="115"
                                            strokeWidth="0.5"
                                        />
                                        <line
                                            x1="325"
                                            y1="120"
                                            x2="345"
                                            y2="120"
                                            strokeWidth="0.5"
                                        />
                                        <line
                                            x1="325"
                                            y1="125"
                                            x2="345"
                                            y2="125"
                                            strokeWidth="0.5"
                                        />
                                    </motion.g>
                                </motion.g>

                                {/* Turret (3D isometric) */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.9 }}
                                >
                                    {/* Turret base ring */}
                                    <motion.ellipse
                                        cx="180"
                                        cy="105"
                                        rx="70"
                                        ry="15"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 2 }}
                                        strokeWidth="1.5"
                                    />

                                    {/* Turret main body - left side */}
                                    <motion.path
                                        d="M 110 105 L 110 70 L 130 55 L 200 55"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 2.1 }}
                                        strokeWidth="1.5"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Turret main body - right side */}
                                    <motion.path
                                        d="M 200 55 L 240 55 L 260 75 L 260 105"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 2.2 }}
                                        strokeWidth="1.5"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Turret top */}
                                    <motion.path
                                        d="M 130 55 L 145 45 L 225 45 L 240 55"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.4, delay: 2.3 }}
                                        strokeWidth="1.5"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Turret side armor */}
                                    <motion.path
                                        d="M 145 45 L 145 55"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.2, delay: 2.4 }}
                                        strokeWidth="1"
                                    />
                                    <motion.path
                                        d="M 225 45 L 225 55"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.2, delay: 2.4 }}
                                        strokeWidth="1"
                                    />

                                    {/* Commander's cupola */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 2.5 }}
                                    >
                                        <rect
                                            x="185"
                                            y="35"
                                            width="25"
                                            height="12"
                                            rx="2"
                                            strokeWidth="1.5"
                                        />
                                        <rect
                                            x="190"
                                            y="28"
                                            width="15"
                                            height="8"
                                            rx="1"
                                            strokeWidth="1"
                                        />
                                        {/* Periscopes */}
                                        <rect
                                            x="192"
                                            y="22"
                                            width="4"
                                            height="6"
                                            strokeWidth="0.5"
                                        />
                                        <rect
                                            x="199"
                                            y="22"
                                            width="4"
                                            height="6"
                                            strokeWidth="0.5"
                                        />
                                    </motion.g>

                                    {/* Smoke grenade launchers */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.8 }}
                                        transition={{ delay: 2.6 }}
                                    >
                                        <rect
                                            x="262"
                                            y="65"
                                            width="6"
                                            height="15"
                                            rx="1"
                                            strokeWidth="1"
                                        />
                                        <rect
                                            x="270"
                                            y="65"
                                            width="6"
                                            height="15"
                                            rx="1"
                                            strokeWidth="1"
                                        />
                                        <rect
                                            x="278"
                                            y="65"
                                            width="6"
                                            height="15"
                                            rx="1"
                                            strokeWidth="1"
                                        />
                                    </motion.g>
                                </motion.g>

                                {/* Main Gun with recoil animation and barrel rotation */}
                                <motion.g
                                    initial={{ x: 0, rotate: 0 }}
                                    animate={{
                                        x: [0, 0, -20, -15, 0],
                                        rotate: [0, 0, -12, -6, 0],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        repeatDelay: 2.5,
                                        times: [0, 0.1, 0.2, 0.4, 1],
                                        ease: 'easeOut',
                                    }}
                                    style={{ transformOrigin: '110px 74px' }}
                                >
                                    {/* Gun barrel */}
                                    <motion.path
                                        d="M 110 72 L 20 65 L 15 68 L 15 78 L 20 81 L 110 76"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, delay: 2.7 }}
                                        strokeWidth="2"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Muzzle brake */}
                                    <motion.path
                                        d="M 20 62 L 8 58 L 5 62 L 5 84 L 8 88 L 20 84"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.4, delay: 2.9 }}
                                        strokeWidth="1.5"
                                        filter="url(#glowTank)"
                                    />

                                    {/* Muzzle brake slots */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.6 }}
                                        transition={{ delay: 3 }}
                                    >
                                        <line
                                            x1="12"
                                            y1="62"
                                            x2="12"
                                            y2="68"
                                            strokeWidth="1"
                                        />
                                        <line
                                            x1="12"
                                            y1="78"
                                            x2="12"
                                            y2="84"
                                            strokeWidth="1"
                                        />
                                    </motion.g>
                                </motion.g>

                                {/* Muzzle flash animation */}
                                <motion.g
                                    initial={{ opacity: 0, scale: 0.3 }}
                                    animate={{
                                        opacity: [0, 0, 1, 0.8, 0],
                                        scale: [0.3, 0.3, 1.5, 1.2, 0.3],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        repeatDelay: 2.5,
                                        times: [0, 0.1, 0.2, 0.35, 0.5],
                                        ease: 'easeOut',
                                    }}
                                    style={{
                                        transformOrigin: `5px 73px`,
                                        transformBox: 'fill-box',
                                    }}
                                >
                                    <path
                                        d="M 5 73 L -20 60 L -8 73 L -20 86 Z"
                                        fill="#7F00FF"
                                        stroke="#7F00FF"
                                        strokeWidth="2"
                                    />
                                    <circle
                                        cx="-8"
                                        cy="73"
                                        r="10"
                                        fill="none"
                                        stroke="#7F00FF"
                                        strokeWidth="2"
                                        opacity="0.7"
                                    />
                                    <circle
                                        cx="-15"
                                        cy="73"
                                        r="15"
                                        fill="none"
                                        stroke="#7F00FF"
                                        strokeWidth="1"
                                        opacity="0.4"
                                    />
                                </motion.g>

                                {/* Antenna */}
                                <motion.g
                                    animate={{ rotate: [-2, 2, -2] }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                    style={{
                                        transformOrigin: `200px 28px`,
                                        transformBox: 'fill-box',
                                    }}
                                >
                                    <motion.path
                                        d="M 200 28 L 203 5"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.3, delay: 3.1 }}
                                        strokeWidth="1"
                                    />
                                    <motion.circle
                                        cx="203"
                                        cy="4"
                                        r="2"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.2, delay: 3.2 }}
                                        fill="#7F00FF"
                                        stroke="none"
                                    />
                                </motion.g>

                                {/* ERA blocks on turret front */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.6 }}
                                    transition={{ delay: 3.3 }}
                                >
                                    <rect
                                        x="112"
                                        y="72"
                                        width="8"
                                        height="12"
                                        strokeWidth="0.5"
                                    />
                                    <rect
                                        x="122"
                                        y="70"
                                        width="8"
                                        height="14"
                                        strokeWidth="0.5"
                                    />
                                    <rect
                                        x="132"
                                        y="68"
                                        width="8"
                                        height="16"
                                        strokeWidth="0.5"
                                    />
                                </motion.g>
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
