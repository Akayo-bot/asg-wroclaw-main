import { useEffect, useRef } from 'react';

interface TargetCursorProps {
    targetSelector?: string;
    spinDuration?: number;
    hideDefaultCursor?: boolean;
}

const SimpleCursor = ({ targetSelector = '.cursor-target', hideDefaultCursor = true }: TargetCursorProps) => {
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!cursorRef.current || typeof window === 'undefined') return;

        const cursor = cursorRef.current;
        let isVisible = false;

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

        const showCursor = () => {
            if (!cursor) return;
            cursor.style.opacity = '1';
            isVisible = true;
        };

        const hideCursor = () => {
            if (!cursor) return;
            cursor.style.opacity = '0';
            isVisible = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            moveCursor(e);
            if (!isVisible) showCursor();
        };

        const handleMouseLeave = () => {
            hideCursor();
        };

        // Add event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        // Hide default cursor if needed
        if (hideDefaultCursor) {
            document.body.style.cursor = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.body.style.cursor = '';
        };
    }, [hideDefaultCursor]);

    return (
        <div
            ref={cursorRef}
            className="fixed pointer-events-none z-[9999] opacity-0 transition-opacity duration-200"
            style={{
                width: '20px',
                height: '20px',
                border: '2px solid #4CAF50',
                borderRadius: '50%',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)',
            }}
        />
    );
};

export default SimpleCursor;



