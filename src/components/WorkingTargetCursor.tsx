import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TargetCursorProps {
    targetSelector?: string;
    spinDuration?: number;
    hideDefaultCursor?: boolean;
}

const WorkingTargetCursor = ({ targetSelector = '.cursor-target', hideDefaultCursor = true }: TargetCursorProps) => {
    const isMobile = useIsMobile();
    const cursorRef = useRef<HTMLDivElement>(null);
    const cornersRef = useRef<HTMLDivElement>(null);

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

        const moveCursor = (e: MouseEvent) => {
            if (!cursor) return;

            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            cursor.style.transform = 'translate(-50%, -50%)';
        };

        const updateCorners = (target: Element) => {
            if (!corners) return;

            const rect = target.getBoundingClientRect();
            const padding = 6; // Reduced offset as requested

            corners.style.left = (rect.left - padding) + 'px';
            corners.style.top = (rect.top - padding) + 'px';
            corners.style.width = (rect.width + padding * 2) + 'px';
            corners.style.height = (rect.height + padding * 2) + 'px';
            corners.style.opacity = '1';
        };

        const hideCorners = () => {
            if (!corners) return;
            corners.style.opacity = '0';
        };

        const handleMouseMove = (e: MouseEvent) => {
            moveCursor(e);

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
    }, [targetSelector, hideDefaultCursor, isMobile]);

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
                    border: '3px solid #4CAF50',
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
                    border: '3px solid #4CAF50',
                    borderRadius: '4px',
                    filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.3))',
                }}
            >
                {/* Corner brackets */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-3px',
                        left: '-3px',
                        width: '12px',
                        height: '12px',
                        borderTop: '3px solid #4CAF50',
                        borderLeft: '3px solid #4CAF50',
                        borderRadius: '2px 0 0 0',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        width: '12px',
                        height: '12px',
                        borderTop: '3px solid #4CAF50',
                        borderRight: '3px solid #4CAF50',
                        borderRadius: '0 2px 0 0',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-3px',
                        left: '-3px',
                        width: '12px',
                        height: '12px',
                        borderBottom: '3px solid #4CAF50',
                        borderLeft: '3px solid #4CAF50',
                        borderRadius: '0 0 0 2px',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-3px',
                        right: '-3px',
                        width: '12px',
                        height: '12px',
                        borderBottom: '3px solid #4CAF50',
                        borderRight: '3px solid #4CAF50',
                        borderRadius: '0 0 2px 0',
                    }}
                />
            </div>
        </>
    );
};

export default WorkingTargetCursor;


