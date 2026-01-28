'use client';

import { motion } from 'framer-motion';

export function RoboticsDisplay() {
    return (
        <div className="w-full h-full p-2">
            <div className="relative bg-[#0f0f0f] rounded-lg overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0">
                    <svg width="100%" height="100%" className="opacity-10">
                        <defs>
                            <pattern
                                id="smallGridRobotics"
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
                                id="gridRobotics"
                                width="100"
                                height="100"
                                patternUnits="userSpaceOnUse"
                            >
                                <rect
                                    width="100"
                                    height="100"
                                    fill="url(#smallGridRobotics)"
                                />
                                <path
                                    d="M 100 0 L 0 0 0 100"
                                    fill="none"
                                    stroke="#7F00FF"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridRobotics)" />
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
                                Robotics
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
                                <filter id="glowRobotics">
                                    <feGaussianBlur
                                        stdDeviation="1.5"
                                        result="coloredBlur"
                                    />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Cute Robot - Standing still with blinking eyes */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* HEAD - Large round head */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {/* Main head shape - rounded */}
                                    <motion.ellipse
                                        cx="200"
                                        cy="80"
                                        rx="55"
                                        ry="50"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.6, delay: 0.3 }}
                                        strokeWidth="2"
                                        filter="url(#glowRobotics)"
                                    />

                                    {/* Head top panel */}
                                    <motion.path
                                        d="M 170 40 L 230 40 L 235 50 L 165 50 Z"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.3, delay: 0.5 }}
                                        strokeWidth="1.5"
                                    />

                                    {/* Top light/indicator */}
                                    <motion.rect
                                        x="190"
                                        y="32"
                                        width="20"
                                        height="8"
                                        rx="2"
                                        strokeWidth="1.5"
                                    />
                                    <motion.rect
                                        x="193"
                                        y="34"
                                        width="14"
                                        height="4"
                                        rx="1"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        fill="#7F00FF"
                                        stroke="none"
                                    />

                                    {/* Antennas */}
                                    <motion.line
                                        x1="155"
                                        y1="45"
                                        x2="150"
                                        y2="25"
                                        strokeWidth="1.5"
                                    />
                                    <motion.circle
                                        cx="150"
                                        cy="22"
                                        r="3"
                                        strokeWidth="1.5"
                                    />
                                    <motion.line
                                        x1="245"
                                        y1="45"
                                        x2="250"
                                        y2="25"
                                        strokeWidth="1.5"
                                    />
                                    <motion.circle
                                        cx="250"
                                        cy="22"
                                        r="3"
                                        strokeWidth="1.5"
                                    />

                                    {/* Ear panels - left */}
                                    <motion.ellipse
                                        cx="148"
                                        cy="80"
                                        rx="12"
                                        ry="18"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.4, delay: 0.6 }}
                                        strokeWidth="1.5"
                                    />

                                    {/* Ear panels - right */}
                                    <motion.ellipse
                                        cx="252"
                                        cy="80"
                                        rx="12"
                                        ry="18"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.4, delay: 0.6 }}
                                        strokeWidth="1.5"
                                    />

                                    {/* LEFT EYE - Large circular lens with expressive blinking */}
                                    <motion.g>
                                        {/* Eye socket */}
                                        <motion.circle
                                            cx="175"
                                            cy="80"
                                            r="22"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.4, delay: 0.7 }}
                                            strokeWidth="2"
                                            filter="url(#glowRobotics)"
                                        />
                                        {/* Inner ring - scales with blink */}
                                        <motion.circle
                                            cx="175"
                                            cy="80"
                                            r="16"
                                            strokeWidth="1.5"
                                            animate={{
                                                scaleY: [1, 1, 0.2, 1, 1, 1, 0.2, 0.2, 1],
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.3, 0.35, 0.4, 0.7, 0.75, 0.8,
                                                    0.85, 0.9,
                                                ],
                                                ease: 'easeInOut',
                                            }}
                                        />
                                        {/* Pupil - animated blink with varying patterns */}
                                        <motion.ellipse
                                            cx="175"
                                            cy="80"
                                            rx="10"
                                            ry="10"
                                            animate={{
                                                scaleY: [
                                                    1, 1, 0.05, 1, 1, 1, 0.05, 0.05, 1,
                                                ],
                                                scaleX: [
                                                    1, 1, 0.95, 1, 1, 1, 0.95, 0.95, 1,
                                                ],
                                                opacity: [
                                                    1, 1, 0.3, 1, 1, 1, 0.3, 0.3, 1,
                                                ],
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.3, 0.35, 0.4, 0.7, 0.75, 0.8,
                                                    0.85, 0.9,
                                                ],
                                                ease: 'easeInOut',
                                            }}
                                            fill="#7F00FF"
                                            fillOpacity="0.7"
                                            strokeWidth="1"
                                        />
                                        {/* Eye highlight - moves and dims with blink */}
                                        <motion.circle
                                            cx="170"
                                            cy="75"
                                            r="4"
                                            animate={{
                                                opacity: [
                                                    0.6, 0.6, 0.1, 0.6, 0.6, 0.6, 0.1,
                                                    0.1, 0.6,
                                                ],
                                                scale: [1, 1, 0.5, 1, 1, 1, 0.5, 0.5, 1],
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.3, 0.35, 0.4, 0.7, 0.75, 0.8,
                                                    0.85, 0.9,
                                                ],
                                            }}
                                            fill="#7F00FF"
                                            fillOpacity="0.4"
                                            stroke="none"
                                        />
                                        {/* Upper eyelid effect */}
                                        <motion.rect
                                            x="153"
                                            y="58"
                                            width="44"
                                            height="3"
                                            fill="#7F00FF"
                                            fillOpacity="0.3"
                                            stroke="none"
                                            rx="1"
                                            animate={{
                                                y: [58, 58, 78, 58, 58, 58, 78, 78, 58],
                                                height: [3, 3, 25, 3, 3, 3, 25, 25, 3],
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.3, 0.35, 0.4, 0.7, 0.75, 0.8,
                                                    0.85, 0.9,
                                                ],
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    </motion.g>

                                    {/* RIGHT EYE - Large circular lens with expressive blinking */}
                                    <motion.g>
                                        {/* Eye socket */}
                                        <motion.circle
                                            cx="225"
                                            cy="80"
                                            r="22"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.4, delay: 0.7 }}
                                            strokeWidth="2"
                                            filter="url(#glowRobotics)"
                                        />
                                        {/* Inner ring - scales with blink */}
                                        <motion.circle
                                            cx="225"
                                            cy="80"
                                            r="16"
                                            strokeWidth="1.5"
                                            animate={{
                                                scaleY: [1, 1, 0.2, 1, 1, 1, 0.2, 0.2, 1],
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.3, 0.35, 0.4, 0.7, 0.75, 0.8,
                                                    0.85, 0.9,
                                                ],
                                                ease: 'easeInOut',
                                            }}
                                        />
                                        {/* Pupil - animated blink with varying patterns */}
                                        <motion.ellipse
                                            cx="225"
                                            cy="80"
                                            rx="10"
                                            ry="10"
                                            animate={{
                                                scaleY: [
                                                    1, 1, 0.05, 1, 1, 1, 0.05, 0.05, 1,
                                                ],
                                                scaleX: [
                                                    1, 1, 0.95, 1, 1, 1, 0.95, 0.95, 1,
                                                ],
                                                opacity: [
                                                    1, 1, 0.3, 1, 1, 1, 0.3, 0.3, 1,
                                                ],
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.3, 0.35, 0.4, 0.7, 0.75, 0.8,
                                                    0.85, 0.9,
                                                ],
                                                ease: 'easeInOut',
                                            }}
                                            fill="#7F00FF"
                                            fillOpacity="0.7"
                                            strokeWidth="1"
                                        />
                                        {/* Eye highlight - moves and dims with blink */}
                                        <motion.circle
                                            cx="220"
                                            cy="75"
                                            r="4"
                                            animate={{
                                                opacity: [
                                                    0.6, 0.6, 0.1, 0.6, 0.6, 0.6, 0.1,
                                                    0.1, 0.6,
                                                ],
                                                scale: [1, 1, 0.5, 1, 1, 1, 0.5, 0.5, 1],
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.3, 0.35, 0.4, 0.7, 0.75, 0.8,
                                                    0.85, 0.9,
                                                ],
                                            }}
                                            fill="#7F00FF"
                                            fillOpacity="0.4"
                                            stroke="none"
                                        />
                                        {/* Upper eyelid effect */}
                                        <motion.rect
                                            x="203"
                                            y="58"
                                            width="44"
                                            height="3"
                                            fill="#7F00FF"
                                            fillOpacity="0.3"
                                            stroke="none"
                                            rx="1"
                                            animate={{
                                                y: [58, 58, 78, 58, 58, 58, 78, 78, 58],
                                                height: [3, 3, 25, 3, 3, 3, 25, 25, 3],
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                times: [
                                                    0, 0.3, 0.35, 0.4, 0.7, 0.75, 0.8,
                                                    0.85, 0.9,
                                                ],
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    </motion.g>

                                    {/* Small mouth/speaker */}
                                    <motion.path
                                        d="M 190 105 Q 200 110 210 105"
                                        strokeWidth="1.5"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.3, delay: 0.9 }}
                                    />
                                </motion.g>

                                {/* NECK */}
                                <motion.path
                                    d="M 190 125 L 190 138 L 210 138 L 210 125"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.2, delay: 0.9 }}
                                    strokeWidth="1.5"
                                />

                                {/* BODY - Compact torso */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.0 }}
                                >
                                    {/* Main body */}
                                    <motion.path
                                        d="M 165 138 L 235 138 L 240 190 L 160 190 Z"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 1.0 }}
                                        strokeWidth="2"
                                        filter="url(#glowRobotics)"
                                    />

                                    {/* Chest panel */}
                                    <motion.rect
                                        x="180"
                                        y="148"
                                        width="40"
                                        height="30"
                                        rx="3"
                                        strokeWidth="1.5"
                                    />

                                    {/* Chest indicator lights */}
                                    <motion.circle
                                        cx="192"
                                        cy="158"
                                        r="4"
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        fill="#7F00FF"
                                        stroke="none"
                                    />
                                    <motion.circle
                                        cx="208"
                                        cy="158"
                                        r="4"
                                        animate={{ opacity: [1, 0.4, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        fill="#7F00FF"
                                        stroke="none"
                                    />

                                    {/* Chest vent lines */}
                                    <motion.line
                                        x1="185"
                                        y1="168"
                                        x2="215"
                                        y2="168"
                                        strokeWidth="1"
                                        opacity="0.6"
                                    />
                                    <motion.line
                                        x1="185"
                                        y1="173"
                                        x2="215"
                                        y2="173"
                                        strokeWidth="1"
                                        opacity="0.6"
                                    />
                                </motion.g>

                                {/* LEFT ARM - Raised up waving */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.1 }}
                                >
                                    {/* Shoulder - attached to body */}
                                    <motion.circle
                                        cx="160"
                                        cy="148"
                                        r="8"
                                        strokeWidth="1.5"
                                    />
                                    <motion.circle
                                        cx="160"
                                        cy="148"
                                        r="3"
                                        fill="#7F00FF"
                                        stroke="none"
                                    />

                                    {/* Upper arm (bicep) - horizontal pointing left (90 anticlockwise) */}
                                    <motion.rect
                                        x="125"
                                        y="140"
                                        width="35"
                                        height="16"
                                        rx="4"
                                        strokeWidth="1.5"
                                    />

                                    {/* Elbow joint */}
                                    <motion.circle
                                        cx="122"
                                        cy="148"
                                        r="6"
                                        strokeWidth="1.5"
                                    />

                                    {/* Forearm and Hand - pointing UP (90 clockwise from bicep), waving */}
                                    <motion.g
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: [-15, 15, -15] }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            repeatDelay: 0,
                                        }}
                                        style={{ transformOrigin: '122px 148px' }}
                                    >
                                        {/* Forearm - pointing up */}
                                        <motion.rect
                                            x="116"
                                            y="110"
                                            width="12"
                                            height="38"
                                            rx="3"
                                            strokeWidth="1.5"
                                        />

                                        {/* Hand - at top */}
                                        <motion.ellipse
                                            cx="122"
                                            cy="103"
                                            rx="10"
                                            ry="8"
                                            strokeWidth="1.5"
                                        />
                                        <motion.line
                                            x1="115"
                                            y1="97"
                                            x2="112"
                                            y2="90"
                                            strokeWidth="1"
                                        />
                                        <motion.line
                                            x1="120"
                                            y1="95"
                                            x2="118"
                                            y2="87"
                                            strokeWidth="1"
                                        />
                                        <motion.line
                                            x1="125"
                                            y1="95"
                                            x2="127"
                                            y2="87"
                                            strokeWidth="1"
                                        />
                                    </motion.g>
                                </motion.g>

                                {/* RIGHT ARM */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.1 }}
                                >
                                    {/* Shoulder */}
                                    <motion.circle
                                        cx="240"
                                        cy="148"
                                        r="8"
                                        strokeWidth="1.5"
                                    />
                                    <motion.circle
                                        cx="240"
                                        cy="148"
                                        r="3"
                                        fill="#7F00FF"
                                        stroke="none"
                                    />

                                    {/* Upper arm */}
                                    <motion.rect
                                        x="232"
                                        y="156"
                                        width="16"
                                        height="28"
                                        rx="4"
                                        strokeWidth="1.5"
                                    />

                                    {/* Elbow */}
                                    <motion.circle
                                        cx="240"
                                        cy="188"
                                        r="6"
                                        strokeWidth="1.5"
                                    />

                                    {/* Forearm */}
                                    <motion.rect
                                        x="234"
                                        y="194"
                                        width="12"
                                        height="24"
                                        rx="3"
                                        strokeWidth="1.5"
                                    />

                                    {/* Hand */}
                                    <motion.ellipse
                                        cx="240"
                                        cy="225"
                                        rx="10"
                                        ry="8"
                                        strokeWidth="1.5"
                                    />
                                    <motion.line
                                        x1="247"
                                        y1="228"
                                        x2="250"
                                        y2="235"
                                        strokeWidth="1"
                                    />
                                    <motion.line
                                        x1="242"
                                        y1="230"
                                        x2="244"
                                        y2="238"
                                        strokeWidth="1"
                                    />
                                    <motion.line
                                        x1="237"
                                        y1="230"
                                        x2="235"
                                        y2="238"
                                        strokeWidth="1"
                                    />
                                </motion.g>

                                {/* LEGS */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.2 }}
                                >
                                    {/* Hip section */}
                                    <motion.path
                                        d="M 170 190 L 230 190 L 225 202 L 175 202 Z"
                                        strokeWidth="1.5"
                                    />

                                    {/* Left leg */}
                                    <motion.rect
                                        x="175"
                                        y="202"
                                        width="18"
                                        height="30"
                                        rx="4"
                                        strokeWidth="1.5"
                                    />
                                    <motion.circle
                                        cx="184"
                                        cy="236"
                                        r="5"
                                        strokeWidth="1.5"
                                    />
                                    <motion.rect
                                        x="176"
                                        y="241"
                                        width="16"
                                        height="12"
                                        rx="3"
                                        strokeWidth="1.5"
                                    />
                                    {/* Foot */}
                                    <motion.path
                                        d="M 172 253 L 196 253 L 198 262 L 170 262 Z"
                                        strokeWidth="1.5"
                                    />

                                    {/* Right leg */}
                                    <motion.rect
                                        x="207"
                                        y="202"
                                        width="18"
                                        height="30"
                                        rx="4"
                                        strokeWidth="1.5"
                                    />
                                    <motion.circle
                                        cx="216"
                                        cy="236"
                                        r="5"
                                        strokeWidth="1.5"
                                    />
                                    <motion.rect
                                        x="208"
                                        y="241"
                                        width="16"
                                        height="12"
                                        rx="3"
                                        strokeWidth="1.5"
                                    />
                                    {/* Foot */}
                                    <motion.path
                                        d="M 204 253 L 228 253 L 230 262 L 202 262 Z"
                                        strokeWidth="1.5"
                                    />
                                </motion.g>
                            </motion.g>

                            {/* Technical readouts - left */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 1.5 }}
                            >
                                <rect
                                    x="50"
                                    y="100"
                                    width="35"
                                    height="50"
                                    strokeWidth="1"
                                    rx="2"
                                />
                                <line
                                    x1="55"
                                    y1="112"
                                    x2="80"
                                    y2="112"
                                    strokeWidth="0.5"
                                />
                                <line
                                    x1="55"
                                    y1="122"
                                    x2="75"
                                    y2="122"
                                    strokeWidth="0.5"
                                />
                                <line
                                    x1="55"
                                    y1="132"
                                    x2="70"
                                    y2="132"
                                    strokeWidth="0.5"
                                />
                                <motion.circle
                                    cx="62"
                                    cy="142"
                                    r="3"
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    fill="#7F00FF"
                                    stroke="none"
                                />
                            </motion.g>

                            {/* Technical readouts - right */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 1.6 }}
                            >
                                <rect
                                    x="315"
                                    y="100"
                                    width="35"
                                    height="50"
                                    strokeWidth="1"
                                    rx="2"
                                />
                                <line
                                    x1="320"
                                    y1="112"
                                    x2="345"
                                    y2="112"
                                    strokeWidth="0.5"
                                />
                                <line
                                    x1="320"
                                    y1="122"
                                    x2="340"
                                    y2="122"
                                    strokeWidth="0.5"
                                />
                                <line
                                    x1="320"
                                    y1="132"
                                    x2="335"
                                    y2="132"
                                    strokeWidth="0.5"
                                />
                                <motion.circle
                                    cx="338"
                                    cy="142"
                                    r="3"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    fill="#7F00FF"
                                    stroke="none"
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
