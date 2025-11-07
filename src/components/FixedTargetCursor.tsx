import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TargetCursorProps {
    targetSelector?: string;
    spinDuration?: number;
    hideDefaultCursor?: boolean;
}

const FixedTargetCursor = ({
    targetSelector = '.cursor-target',
    spinDuration = 2,
    hideDefaultCursor = true
}: TargetCursorProps) => {
    const isMobile = useIsMobile();
    const cursorRef = useRef<HTMLDivElement>(null);
    const cornersRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);

    const constants = useMemo(
        () => ({
            borderWidth: 3,
            cornerSize: 12,
            padding: 6 // Reduced offset as requested
        }),
        []
    );

    const moveCursor = useCallback((x: number, y: number) => {
        if (!cursorRef.current) return;

        // Use CSS transforms instead of GSAP
        cursorRef.current.style.left = x + 'px';
        cursorRef.current.style.top = y + 'px';
        cursorRef.current.style.transform = 'translate(-50%, -50%)';
    }, []);

    const updateCorners = useCallback((target: Element) => {
        if (!cornersRef.current) return;

        const rect = target.getBoundingClientRect();
        const padding = constants.padding;

        cornersRef.current.style.left = (rect.left - padding) + 'px';
        cornersRef.current.style.top = (rect.top - padding) + 'px';
        cornersRef.current.style.width = (rect.width + padding * 2) + 'px';
        cornersRef.current.style.height = (rect.height + padding * 2) + 'px';
        cornersRef.current.style.opacity = '1';
    }, [constants.padding]);

    const hideCorners = useCallback(() => {
        if (!cornersRef.current) return;
        cornersRef.current.style.opacity = '0';
    }, []);

    useEffect(() => {
        // Don't run on mobile devices
        if (isMobile) {
            return;
        }

        if (!cursorRef.current || !cornersRef.current || typeof window === 'undefined') return;

        const cursor = cursorRef.current;
        const corners = cornersRef.current;
        let activeTarget: Element | null = null;

        // Set initial position
        cursor.style.left = '50%';
        cursor.style.top = '50%';
        cursor.style.transform = 'translate(-50%, -50%)';

        const handleMouseMove = (e: MouseEvent) => {
            moveCursor(e.clientX, e.clientY);

            // Check for targets
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const interactiveElement = target?.closest(targetSelector);

            if (interactiveElement && interactiveElement !== activeTarget) {
                activeTarget = interactiveElement;
                updateCorners(interactiveElement);
            } else if (!interactiveElement && activeTarget) {
                activeTarget = null;
                hideCorners();
            }
        };

        const handleMouseLeave = () => {
            if (!cursor) return;
            cursor.style.opacity = '0';
            hideCorners();
        };

        const handleMouseEnter = () => {
            if (!cursor) return;
            cursor.style.opacity = '1';
        };

        // Add event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        // Hide default cursor if needed
        if (hideDefaultCursor) {
            document.body.style.cursor = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
            document.body.style.cursor = '';
        };
    }, [targetSelector, hideDefaultCursor, moveCursor, updateCorners, hideCorners, isMobile]);

    // Don't render cursor on mobile devices (after all hooks)
    if (isMobile) {
        return null;
    }

    return (
        <>
            {/* Main cursor */}
            <div
                ref={cursorRef}
                className="fixed pointer-events-none z-[9999] opacity-0 transition-opacity duration-200"
                style={{
                    width: '20px',
                    height: '20px',
                    border: `${constants.borderWidth}px solid #4CAF50`,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    boxShadow: '0 0 8px rgba(76, 175, 80, 0.4)',
                }}
            />

            {/* Target corners */}
            <div
                ref={cornersRef}
                className="fixed pointer-events-none z-[9998] opacity-0 transition-opacity duration-200"
                style={{
                    border: `${constants.borderWidth}px solid #4CAF50`,
                    borderRadius: '4px',
                    filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.3))',
                }}
            >
                {/* Corner brackets */}
                <div
                    style={{
                        position: 'absolute',
                        top: `-${constants.borderWidth}px`,
                        left: `-${constants.borderWidth}px`,
                        width: `${constants.cornerSize}px`,
                        height: `${constants.cornerSize}px`,
                        borderTop: `${constants.borderWidth}px solid #4CAF50`,
                        borderLeft: `${constants.borderWidth}px solid #4CAF50`,
                        borderRadius: '2px 0 0 0',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: `-${constants.borderWidth}px`,
                        right: `-${constants.borderWidth}px`,
                        width: `${constants.cornerSize}px`,
                        height: `${constants.cornerSize}px`,
                        borderTop: `${constants.borderWidth}px solid #4CAF50`,
                        borderRight: `${constants.borderWidth}px solid #4CAF50`,
                        borderRadius: '0 2px 0 0',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: `-${constants.borderWidth}px`,
                        left: `-${constants.borderWidth}px`,
                        width: `${constants.cornerSize}px`,
                        height: `${constants.cornerSize}px`,
                        borderBottom: `${constants.borderWidth}px solid #4CAF50`,
                        borderLeft: `${constants.borderWidth}px solid #4CAF50`,
                        borderRadius: '0 0 0 2px',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: `-${constants.borderWidth}px`,
                        right: `-${constants.borderWidth}px`,
                        width: `${constants.cornerSize}px`,
                        height: `${constants.cornerSize}px`,
                        borderBottom: `${constants.borderWidth}px solid #4CAF50`,
                        borderRight: `${constants.borderWidth}px solid #4CAF50`,
                        borderRadius: '0 0 2px 0',
                    }}
                />
            </div>
        </>
    );
};

export default FixedTargetCursor;