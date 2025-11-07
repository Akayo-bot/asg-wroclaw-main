import { useEffect } from 'react';
import RadarLoader from './RadarLoader';

interface LoadingOverlayProps {
    isLoading: boolean;
    label?: string;
    size?: number;
    blur?: boolean;
}

const LoadingOverlay = ({
    isLoading,
    label = 'SCANNING TARGETS…',
    size = 140,
    blur = true
}: LoadingOverlayProps) => {
    useEffect(() => {
        if (isLoading) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 transition-opacity duration-300"
            style={{
                backdropFilter: blur ? 'blur(8px)' : 'none',
                WebkitBackdropFilter: blur ? 'blur(8px)' : 'none'
            }}
            role="alert"
            aria-live="polite"
            aria-busy="true"
            aria-label={label}
        >
            <RadarLoader label={label} size={size} />
        </div>
    );
};

export default LoadingOverlay;

