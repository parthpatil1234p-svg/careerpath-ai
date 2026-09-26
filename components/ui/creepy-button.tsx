"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CreepyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    /**
     * Optional custom class for the button container
     */
    className?: string;
    /**
     * Optional custom class for the button cover (the visible part)
     */
    coverClassName?: string;
}

type Coords = {
    x: number;
    y: number;
};

export const CreepyButton = ({
    children,
    className,
    coverClassName,
    onClick,
    ...props
}: CreepyButtonProps) => {
    const eyesRef = useRef<HTMLSpanElement>(null);
    const [eyeCoords, setEyeCoords] = useState<Coords>({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const updateEyes = (e: React.MouseEvent | React.TouchEvent) => {
        const userEvent =
            "touches" in e ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);

        if (!eyesRef.current) return;

        // get the center of the eyes container
        const eyesRect = eyesRef.current.getBoundingClientRect();
        const eyesCenter = {
            x: eyesRect.left + eyesRect.width / 2,
            y: eyesRect.top + eyesRect.height / 2,
        };

        // cursor position
        const cursor = {
            x: userEvent.clientX,
            y: userEvent.clientY,
        };

        // calculate the eye angle
        const dx = cursor.x - eyesCenter.x;
        const dy = cursor.y - eyesCenter.y;
        const angle = Math.atan2(-dy, dx) + Math.PI / 2;

        // pupil distance from the eye center
        const visionRangeX = 180; // Max distance to look horizontally
        const visionRangeY = 75; // Max distance to look vertically
        const distance = Math.hypot(dx, dy);

        // Limit the movement so pupils don't go too far
        // We normalize the distance influence
        const x = (Math.sin(angle) * Math.min(distance, visionRangeX)) / visionRangeX;
        const y = (Math.cos(angle) * Math.min(distance, visionRangeY)) / visionRangeY;

        setEyeCoords({ x, y });
    };

    // Reset eyes when mouse leaves
    const resetEyes = () => {
        setEyeCoords({ x: 0, y: 0 });
        setIsHovered(false);
    };

    const pupilStyle = {
        transform: `translate(calc(-50% + ${eyeCoords.x * 50}%), calc(-50% + ${eyeCoords.y * 50}%))`,
    };

    return (
        <button
            className={cn(
                "relative min-w-[9.5em] rounded-2xl bg-slate-950 border border-cyan-500/40 cursor-pointer outline-none select-none group tap-highlight-transparent",
                "shadow-[0_0_24px_rgba(0,242,254,0.3),inset_0_0_12px_rgba(0,242,254,0.2)]",
                "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400",
                className
            )}
            onClick={onClick}
            onMouseMove={(e) => {
                updateEyes(e);
                setIsHovered(true);
            }}
            onTouchMove={updateEyes}
            onMouseLeave={resetEyes}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            {...props}
        >
            {/* Eyes Container */}
            <span
                ref={eyesRef}
                className="absolute flex items-center gap-[0.4em] right-[1.1em] bottom-[0.55em] h-[0.85em] z-0 pointer-events-none"
            >
                {/* Left Eye */}
                <motion.span
                    className="relative w-[0.85em] bg-cyan-50 rounded-full overflow-hidden shadow-[0_0_8px_rgba(0,242,254,0.7)]"
                    animate={{ height: ["0.85em", "0.85em", "0em", "0.85em"] }}
                    transition={{
                        duration: 3.2,
                        times: [0, 0.92, 0.96, 1],
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    <span
                        className="absolute top-1/2 left-1/2 w-[0.4em] h-[0.4em] bg-slate-950 rounded-full border border-cyan-400/80 shadow-[0_0_4px_#00F2FE] transition-transform duration-75 ease-out"
                        style={pupilStyle}
                    />
                </motion.span>
                {/* Right Eye */}
                <motion.span
                    className="relative w-[0.85em] bg-cyan-50 rounded-full overflow-hidden shadow-[0_0_8px_rgba(0,242,254,0.7)]"
                    animate={{ height: ["0.85em", "0.85em", "0em", "0.85em"] }}
                    transition={{
                        duration: 3.2,
                        times: [0, 0.92, 0.96, 1],
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    <span
                        className="absolute top-1/2 left-1/2 w-[0.4em] h-[0.4em] bg-slate-950 rounded-full border border-cyan-400/80 shadow-[0_0_4px_#00F2FE] transition-transform duration-75 ease-out"
                        style={pupilStyle}
                    />
                </motion.span>
            </span>

            {/* Button Cover */}
            <motion.span
                className={cn(
                    "absolute inset-0 block rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-600 to-violet-600 text-white font-bold tracking-wide",
                    "border border-white/40 shadow-[0_4px_20px_rgba(0,242,254,0.4),0_0_20px_rgba(124,58,237,0.35),inset_0_1px_1px_rgba(255,255,255,0.7)]",
                    "flex items-center justify-center px-4 py-2.5",
                    "origin-[1.25em_50%]",
                    coverClassName
                )}
                animate={{
                    rotate: isHovered ? -14 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    mass: 0.8,
                }}
            >
                {children}
            </motion.span>

            {/* Invisible placeholder to maintain size since cover is absolute */}
            <span className="block opacity-0 px-4 py-2.5 font-bold tracking-wide min-w-[9.5em]">
                {children}
            </span>
        </button>
    );
};

export default CreepyButton;
