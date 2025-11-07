import React from 'react';
import { cn } from '@/lib/utils';

interface BurgerMenuLottieProps {
    isOpen?: boolean;
    className?: string;
    onClick?: () => void;
}

const BurgerMenuLottie: React.FC<BurgerMenuLottieProps> = ({
    isOpen = false,
    className,
    onClick,
}) => {
    return (
        <button
            className={cn("relative w-6 h-6 flex items-center justify-center", className)}
            onClick={onClick}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
            {/* Animated Burger Icon */}
            <svg
                className={cn(
                    "transition-transform duration-300",
                    isOpen && "rotate-180"
                )}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {isOpen ? (
                    // X icon when open
                    <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                ) : (
                    // Burger lines when closed
                    <>
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                )}
            </svg>
        </button>
    );
};

export default BurgerMenuLottie;
