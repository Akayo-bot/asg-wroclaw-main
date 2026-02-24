"use client";

import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Calendar1Props extends React.HTMLAttributes<HTMLDivElement> {
    isHoveringExternal?: boolean;
    isFocused?: boolean;
    isPopoverOpen?: boolean;
    triggerAnimation?: number;
    width?: number | string;
    height?: number | string;
}

const Calendar1: React.FC<Calendar1Props> = ({
    className,
    isHoveringExternal,
    isFocused,
    isPopoverOpen,
    triggerAnimation,
    width = 28,
    height = 28,
    ...props
}) => {
    const [day, setDay] = useState(1);
    const controls = useAnimation();
    
    useEffect(() => {
        const isActive = isHoveringExternal || isFocused || isPopoverOpen || (triggerAnimation && triggerAnimation > 0);
        
        let interval: NodeJS.Timeout;

        if (isActive) {
            controls.start("animate");
            // Fixed: Explicit logic to prevent skipping/repeating
            interval = setInterval(() => {
                setDay((prev) => prev >= 31 ? 1 : prev + 1);
            }, 600);
        } else {
            controls.start("initial");
        }

        return () => clearInterval(interval);
    }, [isHoveringExternal, isFocused, isPopoverOpen, triggerAnimation, controls]);

    // Simple SVG Calendar icon construction
    return (
        <div
            className={cn(
                "select-none cursor-pointer p-0.5 flex items-center justify-center transition-colors duration-200",
                "hover:bg-[#46D6C8]/10 rounded-md",
                className
            )}
            style={{ width, height }}
            {...props}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* Calendar Body */}
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                
                {/* Animated content inside the calendar */}
                <AnimatePresence mode="wait">
                    <motion.text
                        key={day}
                        x="12" 
                        y="19" 
                        textAnchor="middle" 
                        fontSize="8" 
                        fill="currentColor" 
                        stroke="none"
                        initial={{ y: -5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ fontFamily: 'inherit', fontWeight: 'bold' }}
                    >
                        {day}
                    </motion.text>
                </AnimatePresence>
            </svg>
        </div>
    );
};

export { Calendar1 };