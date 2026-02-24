import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import './time-wheel.css';

interface TimeWheelProps {
    label: string;
    value: number | undefined;
    onChange: (value: number) => void;
    range: [number, number];
    pad?: boolean;
    className?: string;
}

// Ensure strict visual sync with height
const FONT_SIZE = 32;
const LINE_HEIGHT = FONT_SIZE + 8; // 40px

// Individual number component with rolling animation
function Number({ mv, number, height }: { mv: any; number: number; height: number }) {
    let y = useTransform(mv, (latest: number) => {
        let placeValue = latest % 10;
        let offset = (10 + number - placeValue) % 10;
        let memo = offset * height;
        if (offset > 5) {
            memo -= 10 * height;
        }
        return memo;
    });
    
    return (
        <motion.span 
            className="time-wheel-number" 
            style={{ y }}
        >
            {number}
        </motion.span>
    );
}

// Single digit with rolling animation
function Digit({ place, value, height }: { place: number; value: number; height: number }) {
    let valueRoundedToPlace = Math.floor(value / place);
    let animatedValue = useSpring(valueRoundedToPlace, {
        stiffness: 400,
        damping: 40,
        mass: 1
    });
    
    useEffect(() => {
        animatedValue.set(valueRoundedToPlace);
    }, [animatedValue, valueRoundedToPlace]);
    
    return (
        <div className="time-wheel-digit" style={{ height }}>
            {Array.from({ length: 10 }, (_, i) => (
                <Number key={i} mv={animatedValue} number={i} height={height} />
            ))}
        </div>
    );
}

// Hover-based guard: only the wheel with active mouse hover can process scroll events
let currentHoveredWheelId: string | null = null;

export const TimeWheel: React.FC<TimeWheelProps> = ({
    label,
    value = 0,
    onChange,
    range: [min, max],
    pad = false,
    className
}) => {
    const wheelRef = useRef<HTMLDivElement>(null);
    const isWheeling = useRef(false);
    const id = React.useId();

    // Store latest state in ref to avoid re-binding event listener
    const stateRef = useRef({ value, min, max, onChange });
    
    useEffect(() => {
        stateRef.current = { value, min, max, onChange };
    }, [value, min, max, onChange]);

    const handleIncrement = () => {
        const s = stateRef.current;
        let newValue = s.value + 1;
        if (newValue > s.max) newValue = s.min;
        s.onChange(newValue);
    };

    const handleDecrement = () => {
        const s = stateRef.current;
        let newValue = s.value - 1;
        if (newValue < s.min) newValue = s.max;
        s.onChange(newValue);
    };

    // Track mouse hover
    const handleMouseEnter = () => {
        currentHoveredWheelId = id;
    };

    const handleMouseLeave = () => {
        if (currentHoveredWheelId === id) {
            currentHoveredWheelId = null;
        }
    };

    // Stable wheel event listener
    useEffect(() => {
        const element = wheelRef.current;
        if (!element) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // CRITICAL: Only process if mouse is hovering over THIS wheel
            if (currentHoveredWheelId !== id) {
                return;
            }

            // Throttle
            if (isWheeling.current) return;
            isWheeling.current = true;
            
            if (e.deltaY > 0) {
                handleDecrement();
            } else {
                handleIncrement();
            }

            setTimeout(() => {
                isWheeling.current = false;
            }, 50);
        };

        element.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            element.removeEventListener('wheel', onWheel);
        };
    }, []);

    const places = max >= 10 ? [10, 1] : [1];

    return (
        <div 
            ref={wheelRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "flex flex-col items-center select-none cursor-target group",
                "rounded-xl transition-colors px-1",
                className
            )}
        >
            <button 
                type="button" 
                onClick={() => {
                    let newValue = value + 1;
                    if (newValue > max) newValue = min;
                    onChange(newValue);
                }}
                className="p-0.5 text-gray-500 hover:text-[#46D6C8] transition-colors"
                tabIndex={-1}
            >
                <ChevronUp size={14} />
            </button>
            
            <div className="time-wheel-container py-1">
                <div 
                    className="time-wheel-counter" 
                    style={{ 
                        fontSize: FONT_SIZE,
                        height: LINE_HEIGHT,
                        gap: 1, 
                        color: '#ffffff',
                        fontFamily: 'monospace', 
                        fontWeight: 'bold'
                    }}
                >
                    {places.map(place => (
                        <Digit 
                            key={place} 
                            place={place} 
                            value={value} 
                            height={LINE_HEIGHT} 
                        />
                    ))}
                </div>
                
                <div className="time-wheel-gradient-container">
                    <div 
                        className="time-wheel-top-gradient" 
                        style={{
                            height: 10,
                            background: 'linear-gradient(to bottom, #04070A 0%, transparent 100%)' 
                        }}
                    />
                    <div 
                        className="time-wheel-bottom-gradient" 
                        style={{
                            height: 10,
                            background: 'linear-gradient(to top, #04070A 0%, transparent 100%)'
                        }}
                    />
                </div>
            </div>
            
            <button 
                type="button" 
                onClick={() => {
                    let newValue = value - 1;
                    if (newValue < min) newValue = max;
                    onChange(newValue);
                }}
                className="p-0.5 text-gray-500 hover:text-[#46D6C8] transition-colors"
                tabIndex={-1}
            >
                <ChevronDown size={14} />
            </button>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider group-hover:text-[#46D6C8]/50 transition-colors">{label}</div>
        </div>
    );
};