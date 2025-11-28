import { useState, useEffect } from 'react';

/**
 * Хук для адаптивного размера радара в зависимости от размера экрана
 * 
 * @returns размер радара в пикселях
 * 
 * @example
 * ```tsx
 * const size = useRadarSize();
 * return <RadarLoader size={size} />;
 * ```
 */
const useRadarSize = (): number => {
    const [size, setSize] = useState<number>(() => {
        if (typeof window === 'undefined') return 140;

        if (window.innerWidth < 640) return 100;
        if (window.innerWidth < 1024) return 140;
        return 180;
    });

    useEffect(() => {
        const updateSize = () => {
            if (window.innerWidth < 640) {
                setSize(100); // Mobile
            } else if (window.innerWidth < 1024) {
                setSize(140); // Tablet
            } else {
                setSize(180); // Desktop
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    return size;
};

export default useRadarSize;




















