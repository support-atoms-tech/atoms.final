'use client';

import { motion } from 'framer-motion';

export function BlueprintDisplay() {
    return (
        <div className="w-full h-full p-2">
            <div className="relative bg-[#0f0f0f] rounded-lg overflow-hidden h-full flex flex-col">
                {/* Animated Grid Background */}
                <div className="absolute inset-0">
                    <svg width="100%" height="100%" className="opacity-10">
                        <defs>
                            <pattern
                                id="smallGrid"
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
                                id="grid"
                                width="100"
                                height="100"
                                patternUnits="userSpaceOnUse"
                            >
                                <rect width="100" height="100" fill="url(#smallGrid)" />
                                <path
                                    d="M 100 0 L 0 0 0 100"
                                    fill="none"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative p-4 md:p-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="mb-3">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex items-center justify-between"
                        >
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wider text-center w-full">
                                Automotive
                            </h2>
                        </motion.div>
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 1.2, delay: 0.3 }}
                            className="h-0.5 bg-[#7F00FF] mt-3"
                        />
                    </div>

                    {/* Main Wireframe Car SVG - More Realistic */}
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                        <svg
                            viewBox="100 100 700 250"
                            className="w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                            fill="none"
                            stroke="#7F00FF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <defs>
                                <filter id="glow">
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

                            {/* Car Body - More realistic sedan shape with bumpy motion */}
                            <motion.g
                                animate={{ y: [0, -2, 0, -1, 0] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                {/* Bottom chassis */}
                                <motion.path
                                    d="M 200 260 L 700 260 L 700 280 L 200 280 Z"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    filter="url(#glow)"
                                />

                                {/* Main body */}
                                <motion.path
                                    d="M 220 260 L 220 200 L 280 200 L 310 160 L 400 160 L 430 180 L 520 180 L 550 160 L 580 160 L 600 200 L 680 200 L 680 260"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 2, delay: 0.8 }}
                                    filter="url(#glow)"
                                />

                                {/* Front windshield */}
                                <motion.path
                                    d="M 310 160 L 330 130 L 380 130 L 400 160"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 1.5 }}
                                    filter="url(#glow)"
                                />

                                {/* Roof */}
                                <motion.path
                                    d="M 330 130 L 500 130 L 520 150"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 1.7 }}
                                    filter="url(#glow)"
                                />

                                {/* Rear windshield */}
                                <motion.path
                                    d="M 500 130 L 520 150 L 550 160"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 1.9 }}
                                    filter="url(#glow)"
                                />

                                {/* Side windows */}
                                <motion.line
                                    x1="330"
                                    y1="165"
                                    x2="395"
                                    y2="165"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.1 }}
                                />
                                <motion.line
                                    x1="435"
                                    y1="180"
                                    x2="515"
                                    y2="180"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.2 }}
                                />

                                {/* Hood details */}
                                <motion.path
                                    d="M 600 200 L 650 200 L 650 240 L 680 240"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 2.3 }}
                                    strokeDasharray="4 4"
                                />

                                {/* Door separators */}
                                <motion.line
                                    x1="420"
                                    y1="180"
                                    x2="420"
                                    y2="260"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.4 }}
                                />
                                <motion.line
                                    x1="280"
                                    y1="200"
                                    x2="280"
                                    y2="260"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.5 }}
                                />
                                <motion.line
                                    x1="600"
                                    y1="200"
                                    x2="600"
                                    y2="260"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.6 }}
                                />

                                {/* Side mirror */}
                                <motion.path
                                    d="M 300 195 L 290 190 L 295 185"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 2.7 }}
                                />

                                {/* Front bumper */}
                                <motion.path
                                    d="M 680 240 L 710 245 L 710 255 L 680 260"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.8 }}
                                    filter="url(#glow)"
                                />

                                {/* Rear bumper */}
                                <motion.path
                                    d="M 220 240 L 190 245 L 190 255 L 220 260"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 2.9 }}
                                    filter="url(#glow)"
                                />

                                {/* Front Wheel */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 3 }}
                                >
                                    <motion.circle
                                        cx="300"
                                        cy="280"
                                        r="45"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, delay: 3 }}
                                        filter="url(#glow)"
                                        strokeWidth="2"
                                    />
                                    <motion.circle
                                        cx="300"
                                        cy="280"
                                        r="30"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.6, delay: 3.2 }}
                                    />
                                    <motion.circle
                                        cx="300"
                                        cy="280"
                                        r="15"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.4, delay: 3.4 }}
                                    />
                                    {/* Rotating spokes with cool effect */}
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                        style={{
                                            transformOrigin: `300px 280px`,
                                            transformBox: 'fill-box',
                                        }}
                                    >
                                        <motion.line
                                            x1="300"
                                            y1="250"
                                            x2="300"
                                            y2="310"
                                            strokeWidth="2"
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{
                                                duration: 0.4,
                                                repeat: Infinity,
                                            }}
                                        />
                                        <motion.line
                                            x1="270"
                                            y1="280"
                                            x2="330"
                                            y2="280"
                                            strokeWidth="2"
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{
                                                duration: 0.4,
                                                repeat: Infinity,
                                            }}
                                        />
                                        <motion.line
                                            x1="277"
                                            y1="257"
                                            x2="323"
                                            y2="303"
                                            strokeWidth="1.5"
                                            animate={{ opacity: [1, 0.7, 1] }}
                                            transition={{
                                                duration: 0.3,
                                                repeat: Infinity,
                                            }}
                                        />
                                        <motion.line
                                            x1="277"
                                            y1="303"
                                            x2="323"
                                            y2="257"
                                            strokeWidth="1.5"
                                            animate={{ opacity: [0.7, 1, 0.7] }}
                                            transition={{
                                                duration: 0.3,
                                                repeat: Infinity,
                                            }}
                                        />
                                        <motion.line
                                            x1="285"
                                            y1="262"
                                            x2="315"
                                            y2="298"
                                            strokeWidth="1"
                                            stroke="#7F00FF"
                                        />
                                        <motion.line
                                            x1="285"
                                            y1="298"
                                            x2="315"
                                            y2="262"
                                            strokeWidth="1"
                                            stroke="#7F00FF"
                                        />
                                    </motion.g>
                                    {/* Inner glow ring */}
                                    <motion.circle
                                        cx="300"
                                        cy="280"
                                        r="22"
                                        strokeWidth="1"
                                        stroke="#7F00FF"
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            opacity: [0.5, 1, 0.5],
                                        }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                    />
                                </motion.g>

                                {/* Rear Wheel */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 3.1 }}
                                >
                                    <motion.circle
                                        cx="600"
                                        cy="280"
                                        r="45"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, delay: 3.1 }}
                                        filter="url(#glow)"
                                        strokeWidth="2"
                                    />
                                    <motion.circle
                                        cx="600"
                                        cy="280"
                                        r="30"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.6, delay: 3.3 }}
                                    />
                                    <motion.circle
                                        cx="600"
                                        cy="280"
                                        r="15"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.4, delay: 3.5 }}
                                    />
                                    {/* Rotating spokes with cool effect */}
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                        style={{
                                            transformOrigin: `600px 280px`,
                                            transformBox: 'fill-box',
                                        }}
                                    >
                                        <motion.line
                                            x1="600"
                                            y1="250"
                                            x2="600"
                                            y2="310"
                                            strokeWidth="2"
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{
                                                duration: 0.4,
                                                repeat: Infinity,
                                            }}
                                        />
                                        <motion.line
                                            x1="570"
                                            y1="280"
                                            x2="630"
                                            y2="280"
                                            strokeWidth="2"
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{
                                                duration: 0.4,
                                                repeat: Infinity,
                                            }}
                                        />
                                        <motion.line
                                            x1="577"
                                            y1="257"
                                            x2="623"
                                            y2="303"
                                            strokeWidth="1.5"
                                            animate={{ opacity: [1, 0.7, 1] }}
                                            transition={{
                                                duration: 0.3,
                                                repeat: Infinity,
                                            }}
                                        />
                                        <motion.line
                                            x1="577"
                                            y1="303"
                                            x2="623"
                                            y2="257"
                                            strokeWidth="1.5"
                                            animate={{ opacity: [0.7, 1, 0.7] }}
                                            transition={{
                                                duration: 0.3,
                                                repeat: Infinity,
                                            }}
                                        />
                                        <motion.line
                                            x1="585"
                                            y1="262"
                                            x2="615"
                                            y2="298"
                                            strokeWidth="1"
                                            stroke="#7F00FF"
                                        />
                                        <motion.line
                                            x1="585"
                                            y1="298"
                                            x2="615"
                                            y2="262"
                                            strokeWidth="1"
                                            stroke="#7F00FF"
                                        />
                                    </motion.g>
                                    {/* Inner glow ring */}
                                    <motion.circle
                                        cx="600"
                                        cy="280"
                                        r="22"
                                        strokeWidth="1"
                                        stroke="#7F00FF"
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            opacity: [0.5, 1, 0.5],
                                        }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                    />
                                </motion.g>

                                {/* Headlights */}
                                <motion.circle
                                    cx="690"
                                    cy="235"
                                    r="8"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: [0, 1, 0.8, 1], scale: 1 }}
                                    transition={{ duration: 0.8, delay: 3.6 }}
                                    fill="#7F00FF"
                                    filter="url(#glow)"
                                />
                                <motion.circle
                                    cx="690"
                                    cy="255"
                                    r="8"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: [0, 1, 0.8, 1], scale: 1 }}
                                    transition={{ duration: 0.8, delay: 3.7 }}
                                    fill="#7F00FF"
                                    filter="url(#glow)"
                                />

                                {/* Tail lights */}
                                <motion.rect
                                    x="195"
                                    y="235"
                                    width="10"
                                    height="20"
                                    rx="2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0.7, 1] }}
                                    transition={{ duration: 0.8, delay: 3.8 }}
                                    fill="#ef4444"
                                    filter="url(#glow)"
                                />

                                {/* Undercarriage details */}
                                <motion.line
                                    x1="250"
                                    y1="280"
                                    x2="250"
                                    y2="290"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3, delay: 3.9 }}
                                    strokeDasharray="2 2"
                                />
                                <motion.line
                                    x1="450"
                                    y1="280"
                                    x2="450"
                                    y2="290"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3, delay: 4 }}
                                    strokeDasharray="2 2"
                                />
                                <motion.line
                                    x1="650"
                                    y1="280"
                                    x2="650"
                                    y2="290"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3, delay: 4.1 }}
                                    strokeDasharray="2 2"
                                />

                                {/* Ground line */}
                                <motion.line
                                    x1="150"
                                    y1="325"
                                    x2="750"
                                    y2="325"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.5 }}
                                    transition={{ duration: 1, delay: 4.2 }}
                                    strokeDasharray="10 5"
                                    strokeWidth="1"
                                />

                                {/* Steering Wheel - Rotating to simulate driving */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 3.8 }}
                                >
                                    {/* Steering column */}
                                    <motion.line
                                        x1="350"
                                        y1="210"
                                        x2="350"
                                        y2="220"
                                        stroke="#7F00FF"
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.3, delay: 3.8 }}
                                    />

                                    {/* Rotating steering wheel */}
                                    <motion.g
                                        animate={{
                                            rotate: [-15, 15, -15],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            times: [0, 0.5, 1],
                                        }}
                                        style={{
                                            transformOrigin: `350px 220px`,
                                            transformBox: 'fill-box',
                                        }}
                                    >
                                        {/* Outer rim */}
                                        <motion.circle
                                            cx="350"
                                            cy="220"
                                            r="25"
                                            stroke="#7F00FF"
                                            strokeWidth="2.5"
                                            fill="none"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.5, delay: 3.9 }}
                                            filter="url(#glow)"
                                        />

                                        {/* Inner rim */}
                                        <motion.circle
                                            cx="350"
                                            cy="220"
                                            r="18"
                                            stroke="#7F00FF"
                                            strokeWidth="1.5"
                                            fill="none"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.4, delay: 4 }}
                                        />

                                        {/* Spokes */}
                                        <motion.line
                                            x1="350"
                                            y1="195"
                                            x2="350"
                                            y2="202"
                                            stroke="#7F00FF"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.3, delay: 4.1 }}
                                        />
                                        <motion.line
                                            x1="350"
                                            y1="245"
                                            x2="350"
                                            y2="238"
                                            stroke="#7F00FF"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.3, delay: 4.1 }}
                                        />
                                        <motion.line
                                            x1="325"
                                            y1="220"
                                            x2="332"
                                            y2="220"
                                            stroke="#7F00FF"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.3, delay: 4.1 }}
                                        />
                                        <motion.line
                                            x1="375"
                                            y1="220"
                                            x2="368"
                                            y2="220"
                                            stroke="#7F00FF"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.3, delay: 4.1 }}
                                        />

                                        {/* Center hub */}
                                        <motion.circle
                                            cx="350"
                                            cy="220"
                                            r="8"
                                            stroke="#7F00FF"
                                            strokeWidth="1.5"
                                            fill="#000000"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.3, delay: 4.2 }}
                                        />
                                    </motion.g>

                                    {/* Driver's hands on wheel */}
                                    <motion.g
                                        animate={{
                                            rotate: [-15, 15, -15],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            times: [0, 0.5, 1],
                                        }}
                                        style={{
                                            transformOrigin: `350px 220px`,
                                            transformBox: 'fill-box',
                                        }}
                                    >
                                        {/* Left hand */}
                                        <motion.path
                                            d="M 330 215 L 325 210 L 320 215"
                                            stroke="#f59e0b"
                                            strokeWidth="2"
                                            fill="none"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.3, delay: 4.3 }}
                                        />

                                        {/* Right hand */}
                                        <motion.path
                                            d="M 370 225 L 375 230 L 380 225"
                                            stroke="#f59e0b"
                                            strokeWidth="2"
                                            fill="none"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.3, delay: 4.3 }}
                                        />
                                    </motion.g>
                                </motion.g>
                            </motion.g>

                            {/* Motion arrows moving left for speed illusion */}
                            <motion.line
                                x1="180"
                                y1="240"
                                x2="150"
                                y2="240"
                                stroke="#7F00FF"
                                strokeWidth="2"
                                initial={{ x: 0, opacity: 0.8 }}
                                animate={{ x: -100, opacity: 0 }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 0,
                                }}
                            />
                            <motion.line
                                x1="180"
                                y1="255"
                                x2="150"
                                y2="255"
                                stroke="#7F00FF"
                                strokeWidth="2"
                                initial={{ x: 0, opacity: 0.8 }}
                                animate={{ x: -100, opacity: 0 }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 0.15,
                                }}
                            />
                            <motion.line
                                x1="180"
                                y1="270"
                                x2="150"
                                y2="270"
                                stroke="#7F00FF"
                                strokeWidth="2"
                                initial={{ x: 0, opacity: 0.8 }}
                                animate={{ x: -100, opacity: 0 }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 0.3,
                                }}
                            />
                            <motion.line
                                x1="180"
                                y1="285"
                                x2="150"
                                y2="285"
                                stroke="#7F00FF"
                                strokeWidth="2"
                                initial={{ x: 0, opacity: 0.8 }}
                                animate={{ x: -100, opacity: 0 }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 0.45,
                                }}
                            />
                            <motion.line
                                x1="200"
                                y1="180"
                                x2="170"
                                y2="180"
                                stroke="#7F00FF"
                                strokeWidth="1.5"
                                initial={{ x: 0, opacity: 0.6 }}
                                animate={{ x: -80, opacity: 0 }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 0,
                                }}
                            />
                            <motion.line
                                x1="200"
                                y1="200"
                                x2="170"
                                y2="200"
                                stroke="#7F00FF"
                                strokeWidth="1.5"
                                initial={{ x: 0, opacity: 0.6 }}
                                animate={{ x: -80, opacity: 0 }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: 0.2,
                                }}
                            />
                        </svg>

                        {/* Road effect */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#7F00FF]/20 to-transparent" />
                    </div>
                </div>

                {/* Corner accents */}
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
