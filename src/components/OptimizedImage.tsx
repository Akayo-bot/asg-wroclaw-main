import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    loading?: 'lazy' | 'eager';
    sizes?: string;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    width,
    height,
    className,
    loading = 'lazy',
    sizes,
    priority = false,
    placeholder = 'empty',
    blurDataURL,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
    };

    // Generate WebP src if possible
    const getOptimizedSrc = (originalSrc: string) => {
        if (originalSrc.startsWith('http') || originalSrc.startsWith('data:')) {
            return originalSrc;
        }

        // For local images, we could implement WebP conversion
        // For now, return original src
        return originalSrc;
    };

    const optimizedSrc = getOptimizedSrc(src);

    if (hasError) {
        return (
            <div
                className={cn(
                    "bg-muted flex items-center justify-center text-muted-foreground",
                    className
                )}
                style={{ width, height }}
            >
                <span className="text-sm">Image failed to load</span>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {placeholder === 'blur' && blurDataURL && !isLoaded && (
                <img
                    src={blurDataURL}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
                    aria-hidden="true"
                />
            )}

            <img
                src={optimizedSrc}
                alt={alt}
                width={width}
                height={height}
                loading={priority ? 'eager' : loading}
                sizes={sizes}
                className={cn(
                    "transition-opacity duration-300",
                    isLoaded ? "opacity-100" : "opacity-0",
                    className
                )}
                onLoad={handleLoad}
                onError={handleError}
                decoding="async"
            />
        </div>
    );
};

export default OptimizedImage;



