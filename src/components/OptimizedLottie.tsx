import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedLottieProps {
    src: string;
    className?: string;
    autoplay?: boolean;
    loop?: boolean;
    speed?: number;
    onLoad?: () => void;
    onError?: () => void;
    fallback?: React.ReactNode;
    initialFrame?: number;
    filterColors?: {
        primary?: string; // hex color
        secondary?: string; // hex color
    };
}

const OptimizedLottie: React.FC<OptimizedLottieProps> = ({
    src,
    className,
    autoplay = true,
    loop = true,
    speed = 1,
    onLoad,
    onError,
    fallback,
    initialFrame,
    filterColors,
}) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<any>(null);
    const filterColorsRef = useRef<{ primary?: string; secondary?: string } | undefined>(filterColors);

    // Обновляем ref при изменении filterColors
    useEffect(() => {
        filterColorsRef.current = filterColors;
    }, [filterColors]);

    useEffect(() => {
        // Load Lottie animation after initial render
        const loadAnimation = () => {
            setShouldLoad(true);
        };

        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadAnimation);
            } else {
                setTimeout(loadAnimation, 200);
            }
        }
    }, []);

    useEffect(() => {
        if (!shouldLoad || !containerRef.current || hasError) return;

        const loadLottie = async () => {
            try {
                // Dynamic import of lottie-web
                const lottie = await import('lottie-web');

                if (containerRef.current) {
                    // Проверяем, не была ли уже загружена анимация
                    if (animationRef.current) {
                        animationRef.current.destroy();
                        animationRef.current = null;
                    }

                    const config: any = {
                        container: containerRef.current,
                        renderer: 'svg',
                        loop: false, // Всегда загружаем с loop=false, потом управляем через useEffect
                        autoplay: false, // Всегда загружаем с autoplay=false, потом управляем через useEffect
                        path: src,
                        speed,
                    };

                    animationRef.current = lottie.default.loadAnimation(config);

                    // Применить изменение цветов, если указано
                    if (filterColorsRef.current && animationRef.current) {
                        const animation = animationRef.current;
                        
                        // Изменить цвета через фильтрацию слоев
                        const setColors = () => {
                            try {
                                if (animation.renderer && animation.renderer.elements) {
                                    animation.renderer.elements.forEach((element: any) => {
                                        if (element.comp && element.comp.data) {
                                            // Изменить primary цвет
                                            if (filterColorsRef.current?.primary) {
                                                const primaryHex = filterColorsRef.current.primary.replace('#', '');
                                                const r = parseInt(primaryHex.substr(0, 2), 16) / 255;
                                                const g = parseInt(primaryHex.substr(2, 2), 16) / 255;
                                                const b = parseInt(primaryHex.substr(4, 2), 16) / 255;
                                                
                                                // Найти и изменить primary цвет в данных
                                                const updateColors = (obj: any) => {
                                                    if (obj && typeof obj === 'object') {
                                                        for (const key in obj) {
                                                            if (key === 'primary' && obj[key] && Array.isArray(obj[key])) {
                                                                obj[key] = [r, g, b];
                                                            } else if (key === 'cl' && obj[key] === 'primary') {
                                                                // Найти связанное значение цвета
                                                            }
                                                            updateColors(obj[key]);
                                                        }
                                                    }
                                                };
                                                updateColors(element.comp.data);
                                            }
                                            
                                            // Изменить secondary цвет
                                            if (filterColorsRef.current?.secondary) {
                                                const secondaryHex = filterColorsRef.current.secondary.replace('#', '');
                                                const r = parseInt(secondaryHex.substr(0, 2), 16) / 255;
                                                const g = parseInt(secondaryHex.substr(2, 2), 16) / 255;
                                                const b = parseInt(secondaryHex.substr(4, 2), 16) / 255;
                                                
                                                const updateColors = (obj: any) => {
                                                    if (obj && typeof obj === 'object') {
                                                        for (const key in obj) {
                                                            if (key === 'secondary' && obj[key] && Array.isArray(obj[key])) {
                                                                obj[key] = [r, g, b];
                                                            }
                                                            updateColors(obj[key]);
                                                        }
                                                    }
                                                };
                                                updateColors(element.comp.data);
                                            }
                                        }
                                    });
                                    
                                    // Перезагрузить анимацию с новыми цветами
                                    animation.renderer.render();
                                }
                            } catch (error) {
                                console.warn('Failed to apply color filters:', error);
                            }
                        };
                        
                        // Попробовать применить цвета после загрузки
                        setTimeout(setColors, 100);
                    }


                    // Сразу показываем нужный кадр после загрузки
                    // Не ждём autoplay, чтобы иконка была видна сразу
                    if (animationRef.current) {
                        // Всегда показываем первый кадр при загрузке
                        animationRef.current.goToAndStop(0, true);
                    }

                    setIsLoaded(true);
                    setIsRendered(true);
                    onLoad?.();
                }
            } catch (error) {
                console.error('Failed to load Lottie animation:', error);
                setHasError(true);
                onError?.();
            }
        };

        loadLottie();

        return () => {
            if (animationRef.current) {
                animationRef.current.destroy();
            }
        };
    }, [shouldLoad, src, speed, onLoad, onError, hasError]); // Убрали filterColors из зависимостей

    // Управление анимацией при изменении autoplay и loop
    useEffect(() => {
        if (!animationRef.current || !isLoaded) return;

        if (autoplay) {
            // Включаем loop и играем
            animationRef.current.setLoop(loop);
            if (animationRef.current.isPaused || animationRef.current.isPaused === undefined) {
                // Если остановлена, начинаем с текущего кадра (не сбрасываем)
                animationRef.current.play();
            } else {
                // Если уже играет, просто обновляем loop
                animationRef.current.setLoop(loop);
            }
        } else {
            // Сохраняем текущий кадр ПЕРЕД остановкой
            const currentFrame = animationRef.current.currentFrame ?? 0;
            // Ставим на паузу - иконка остаётся на текущем кадре
            animationRef.current.pause();
            
            // Если initialFrame задан явно, переключаемся только если нужно
            if (initialFrame !== undefined && initialFrame !== currentFrame) {
                // Плавный переход без force для избежания видимого скачка
                animationRef.current.goToAndStop(initialFrame, false);
            } else {
                // Если initialFrame не задан, возвращаемся на начальный кадр (0)
                animationRef.current.goToAndStop(0, true);
            }
        }
    }, [autoplay, loop, initialFrame, isLoaded]);

    if (hasError) {
        return (
            <div className={cn("bg-muted flex items-center justify-center text-muted-foreground", className)}>
                {fallback || <span className="text-sm">Animation failed to load</span>}
            </div>
        );
    }

    if (!shouldLoad) {
        return (
            <div className={cn("bg-muted flex items-center justify-center", className)}>
                <div className="animate-pulse w-8 h-8 bg-muted-foreground/20 rounded" />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                filterColors ? "rsf-lottie-emerald" : "",
                className
            )}
            style={{ 
                opacity: isRendered ? 1 : 0,
                transition: 'opacity 150ms ease-in-out',
            }}
        />
    );
};

export default OptimizedLottie;



