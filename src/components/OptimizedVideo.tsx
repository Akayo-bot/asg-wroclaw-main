import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedVideoProps {
    src: string;
    poster?: string;
    className?: string;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    playsInline?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
    onLoadStart?: () => void;
    onCanPlay?: () => void;
    onError?: () => void;
}

const OptimizedVideo: React.FC<OptimizedVideoProps> = ({
    src,
    poster,
    className,
    autoplay = false,
    muted = true,
    loop = false,
    playsInline = true,
    preload = 'none',
    onLoadStart,
    onCanPlay,
    onError,
}) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Load video after initial render using requestIdleCallback
        const loadVideo = () => {
            setShouldLoad(true);
        };

        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadVideo);
            } else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(loadVideo, 100);
            }
        }
    }, []);

    const handleLoadStart = () => {
        onLoadStart?.();
    };

    const handleCanPlay = () => {
        setIsLoaded(true);
        onCanPlay?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    if (hasError) {
        return (
            <div className={cn("bg-muted flex items-center justify-center text-muted-foreground", className)}>
                <span className="text-sm">Video failed to load</span>
            </div>
        );
    }

    if (!shouldLoad) {
        return (
            <div className={cn("bg-muted flex items-center justify-center", className)}>
                {poster && (
                    <img
                        src={poster}
                        alt="Video poster"
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                )}
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            className={cn(
                "transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0",
                className
            )}
            poster={poster}
            autoPlay={autoplay}
            muted={muted}
            loop={loop}
            playsInline={playsInline}
            preload={preload}
            onLoadStart={handleLoadStart}
            onCanPlay={handleCanPlay}
            onError={handleError}
        >
            <source src={src} type="video/webm" />
            <source src={src.replace('.webm', '.mp4')} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
    );
};

export default OptimizedVideo;



