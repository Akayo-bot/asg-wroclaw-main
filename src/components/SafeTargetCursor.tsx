import { useEffect, useRef, useCallback, useMemo } from 'react';

interface TargetCursorProps {
    targetSelector?: string;
    spinDuration?: number;
    hideDefaultCursor?: boolean;
}

const SafeTargetCursor = ({
    targetSelector = '.cursor-target',
    spinDuration = 2,
    hideDefaultCursor = true
}: TargetCursorProps) => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
    const spinTl = useRef<any>(null);
    const dotRef = useRef<HTMLDivElement>(null);

    const constants = useMemo(
        () => ({
            borderWidth: 3,
            cornerSize: 12,
            parallaxStrength: 0.00005
        }),
        []
    );

    const moveCursor = useCallback((x: number, y: number) => {
        if (!cursorRef.current) return;

        // Try to use GSAP if available, fallback to CSS
        try {
            // Dynamic import of GSAP to avoid CSP issues
            import('gsap').then(({ gsap }) => {
                if (gsap && cursorRef.current) {
                    gsap.to(cursorRef.current, {
                        x: x - 10,
                        y: y - 10,
                        duration: 0.1,
                        ease: "power2.out"
                    });
                }
            }).catch(() => {
                // Fallback to CSS if GSAP fails
                if (cursorRef.current) {
                    cursorRef.current.style.left = x + 'px';
                    cursorRef.current.style.top = y + 'px';
                    cursorRef.current.style.transform = 'translate(-50%, -50%)';
                }
            });
        } catch (error) {
            // Fallback to CSS if GSAP fails
            if (cursorRef.current) {
                cursorRef.current.style.left = x + 'px';
                cursorRef.current.style.top = y + 'px';
                cursorRef.current.style.transform = 'translate(-50%, -50%)';
            }
        }
    }, []);

    const updateCorners = useCallback((target: Element) => {
        if (!cornersRef.current) return;

        const rect = target.getBoundingClientRect();
        const padding = 6; // Reduced offset as requested

        cornersRef.current.forEach((corner) => {
            if (corner) {
                corner.style.left = (rect.left - padding) + 'px';
                corner.style.top = (rect.top - padding) + 'px';
                corner.style.width = (rect.width + padding * 2) + 'px';
                corner.style.height = (rect.height + padding * 2) + 'px';
                corner.style.opacity = '1';
            }
        });
    }, []);

    const hideCorners = useCallback(() => {
        if (!cornersRef.current) return;

        cornersRef.current.forEach((corner) => {
            if (corner) {
                corner.style.opacity = '0';
            }
        });
    }, []);

    const createSVG = useCallback(() => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100');
        svg.setAttribute('height', '100');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '9998';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,0 L100,0 L100,100 L0,100 Z');
        path.setAttribute('stroke', '#4CAF50');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');

        svg.appendChild(path);
        return svg;
    }, []);

    const getOffsetLeft = useCallback((element: Element) => {
        let offsetLeft = 0;
        let currentElement = element as HTMLElement;

        while (currentElement) {
            offsetLeft += currentElement.offsetLeft;
            currentElement = currentElement.offsetParent as HTMLElement;
        }

        return offsetLeft;
    }, []);

    useEffect(() => {
        if (!cursorRef.current || !cornersRef.current || typeof window === 'undefined') return;

        const cursor = cursorRef.current;
        const corners = cornersRef.current;
        let activeTarget: Element | null = null;
        let isAnimatingToTarget = false;

        // Set initial position
        cursor.style.left = '50%';
        cursor.style.top = '50%';
        cursor.style.transform = 'translate(-50%, -50%)';

        const handleMouseMove = (e: MouseEvent) => {
            if (!cursor || isAnimatingToTarget) return;

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
    }, [targetSelector, hideDefaultCursor, moveCursor, updateCorners, hideCorners]);

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

export default SafeTargetCursor;



