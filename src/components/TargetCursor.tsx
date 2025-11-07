import { useEffect, useRef, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import { useLocation } from 'react-router-dom';
import { useCursor } from '../contexts/CursorContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface TargetCursorProps {
    targetSelector?: string;
    spinDuration?: number;
    hideDefaultCursor?: boolean;
}

const TargetCursor = ({
    targetSelector = '.cursor-target',
    spinDuration = 2,
    hideDefaultCursor = true
}: TargetCursorProps) => {
    const isMobile = useIsMobile();
    const location = useLocation();
    const { position: cursorPosition, isInitialized } = useCursor();
    const cursorRef = useRef<HTMLDivElement>(null);
    const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
    const spinTl = useRef<gsap.core.Timeline | null>(null);
    const dotRef = useRef<HTMLDivElement>(null);

    const constants = useMemo(
        () => ({
            borderWidth: 3,
            cornerSize: 12,
            parallaxStrength: 0.00005
        }),
        []
    );

    const getCursorColor = useCallback((x: number, y: number) => {
        // Всегда возвращаем черно-белую схему
        return {
            color: 'white',
            shadow: 'rgba(255, 255, 255, 0.9)',
            glow: 'rgba(0, 0, 0, 0.8)'
        };
    }, []);

    const moveCursor = useCallback((x: number, y: number) => {
        if (!cursorRef.current || !gsap) return;

        // Сохраняем позицию в контексте
        cursorPosition.current = { x, y };

        // Инициализируем курсор при первом движении мыши
        if (!isInitialized.current) {
            isInitialized.current = true;

            // Устанавливаем начальную позицию и показываем курсор
            gsap.set(cursorRef.current, {
                xPercent: -50,
                yPercent: -50,
                x,
                y,
                opacity: 1
            });

            // Применяем стили сразу при инициализации
            const { color, shadow, glow } = getCursorColor(x, y);

            if (dotRef.current) {
                dotRef.current.style.backgroundColor = color;
                dotRef.current.style.boxShadow = `
                    0 0 4px ${shadow}, 
                    0 0 8px ${shadow}, 
                    0 0 16px ${shadow},
                    0 0 4px ${glow}, 
                    0 0 8px ${glow}, 
                    0 0 16px ${glow}
                `;
            }

            if (cornersRef.current) {
                cornersRef.current.forEach(corner => {
                    corner.style.borderColor = color;
                    corner.style.filter = `
                        drop-shadow(0 0 2px ${shadow}) 
                        drop-shadow(0 0 4px ${shadow}) 
                        drop-shadow(0 0 8px ${shadow})
                        drop-shadow(0 0 2px ${glow}) 
                        drop-shadow(0 0 4px ${glow}) 
                        drop-shadow(0 0 8px ${glow})
                    `;
                });
            }

            return;
        }

        // Получаем цвет для текущей позиции
        const { color, shadow, glow } = getCursorColor(x, y);

        // Обновляем цвет центральной точки с переливающимся свечением
        if (dotRef.current) {
            dotRef.current.style.backgroundColor = color;
            dotRef.current.style.boxShadow = `
                0 0 4px ${shadow}, 
                0 0 8px ${shadow}, 
                0 0 16px ${shadow},
                0 0 4px ${glow}, 
                0 0 8px ${glow}, 
                0 0 16px ${glow}
            `;
        }

        // Обновляем цвет углов с переливающимся свечением
        if (cornersRef.current) {
            cornersRef.current.forEach((corner, index) => {
                corner.style.borderColor = color;
                corner.style.filter = `
                    drop-shadow(0 0 2px ${shadow}) 
                    drop-shadow(0 0 4px ${shadow}) 
                    drop-shadow(0 0 8px ${shadow})
                    drop-shadow(0 0 2px ${glow}) 
                    drop-shadow(0 0 4px ${glow}) 
                    drop-shadow(0 0 8px ${glow})
                `;
            });
        }

        // Используем более быструю анимацию для лучшей производительности
        gsap.to(cursorRef.current, {
            x,
            y,
            duration: 0.05, // Уменьшено для лучшей производительности
            ease: "none" // Убрано для лучшей производительности
        });
    }, [getCursorColor, cursorPosition, isInitialized]);

    useEffect(() => {
        // Don't run on mobile devices
        if (isMobile) {
            return;
        }

        if (!cursorRef.current || !gsap || typeof window === 'undefined') {
            return;
        }

        const originalCursor = document.body.style.cursor;
        if (hideDefaultCursor) {
            document.body.style.cursor = 'none';
        }

        const cursor = cursorRef.current;
        cornersRef.current = cursor.querySelectorAll('.target-cursor-corner');

        let activeTarget: Element | null = null;
        let currentTargetMove: ((e: MouseEvent) => void) | null = null;
        let currentLeaveHandler: (() => void) | null = null;
        let isAnimatingToTarget = false;
        let resumeTimeout: NodeJS.Timeout | null = null;

        const cleanupTarget = (target: Element) => {
            if (currentTargetMove) {
                target.removeEventListener('mousemove', currentTargetMove);
            }
            if (currentLeaveHandler) {
                target.removeEventListener('mouseleave', currentLeaveHandler);
            }
            currentTargetMove = null;
            currentLeaveHandler = null;
        };

        // Не инициализируем позицию - ждем первого движения мыши
        gsap.set(cursor, {
            xPercent: -50,
            yPercent: -50,
            opacity: 0 // Скрываем до первого движения мыши
        });

        const createSpinTimeline = () => {
            if (!gsap) return;
            if (spinTl.current) {
                spinTl.current.kill();
            }
            spinTl.current = gsap
                .timeline({ repeat: -1 })
                .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
        };

        createSpinTimeline();

        const moveHandler = (e: MouseEvent) => moveCursor(e.clientX, e.clientY);
        window.addEventListener('mousemove', moveHandler);

        const scrollHandler = () => {
            if (!activeTarget || !cursorRef.current) return;

            const mouseX = gsap.getProperty(cursorRef.current, 'x') as number;
            const mouseY = gsap.getProperty(cursorRef.current, 'y') as number;

            const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
            const isStillOverTarget =
                elementUnderMouse &&
                (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget);

            if (!isStillOverTarget) {
                if (currentLeaveHandler) {
                    currentLeaveHandler();
                }
            }
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });

        const mouseDownHandler = () => {
            if (!dotRef.current) return;
            gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 });
            gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 });
        };

        const mouseUpHandler = () => {
            if (!dotRef.current) return;
            gsap.to(dotRef.current, { scale: 1, duration: 0.3 });
            gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
        };

        window.addEventListener('mousedown', mouseDownHandler);
        window.addEventListener('mouseup', mouseUpHandler);

        const enterHandler = (e: MouseEvent) => {
            const directTarget = e.target as Element;

            const allTargets: Element[] = [];
            let current: Element | null = directTarget;
            while (current && current !== document.body && current !== document.documentElement) {
                if (current.matches(targetSelector)) {
                    allTargets.push(current);
                }
                current = current.parentElement;
            }

            // Если не найден target через цепочку родителей, попробуем найти через closest
            // Это помогает с элементами в порталах (Radix UI)
            let target = allTargets[0] || null;
            if (!target && directTarget) {
                target = directTarget.closest(targetSelector);
            }

            // Специальная проверка для кнопки выхода и других data-атрибутов
            if (!target && directTarget) {
                const specialSelectors = [
                    '[data-logout-button]',
                    '[data-radix-dropdown-menu-item]',
                    '[data-radix-context-menu-item]',
                    '[role="menuitem"]'
                ];

                for (const selector of specialSelectors) {
                    const specialTarget = directTarget.closest(selector);
                    if (specialTarget) {
                        target = specialTarget;
                        break;
                    }
                }
            }

            if (!target || !cursorRef.current || !cornersRef.current) return;

            if (activeTarget === target) return;

            if (activeTarget) {
                cleanupTarget(activeTarget);
            }

            if (resumeTimeout) {
                clearTimeout(resumeTimeout);
                resumeTimeout = null;
            }

            activeTarget = target;
            const corners = Array.from(cornersRef.current);
            corners.forEach(corner => {
                gsap.killTweensOf(corner);
            });
            gsap.killTweensOf(cursorRef.current, 'rotation');
            spinTl.current?.pause();

            gsap.set(cursorRef.current, { rotation: 0 });

            const updateCorners = (mouseX?: number, mouseY?: number) => {
                const rect = target.getBoundingClientRect();
                const cursorRect = cursorRef.current!.getBoundingClientRect();

                const cursorCenterX = cursorRect.left + cursorRect.width / 2;
                const cursorCenterY = cursorRect.top + cursorRect.height / 2;

                const [tlc, trc, brc, blc] = Array.from(cornersRef.current!);

                const { borderWidth, cornerSize, parallaxStrength } = constants;

                const padding = 6; // Уменьшенный отступ для лучшей видимости
                let tlOffset = {
                    x: rect.left - cursorCenterX - borderWidth - padding,
                    y: rect.top - cursorCenterY - borderWidth - padding
                };
                let trOffset = {
                    x: rect.right - cursorCenterX + borderWidth - cornerSize + padding,
                    y: rect.top - cursorCenterY - borderWidth - padding
                };
                let brOffset = {
                    x: rect.right - cursorCenterX + borderWidth - cornerSize + padding,
                    y: rect.bottom - cursorCenterY + borderWidth - cornerSize + padding
                };
                let blOffset = {
                    x: rect.left - cursorCenterX - borderWidth - padding,
                    y: rect.bottom - cursorCenterY + borderWidth - cornerSize + padding
                };

                if (mouseX !== undefined && mouseY !== undefined) {
                    const targetCenterX = rect.left + rect.width / 2;
                    const targetCenterY = rect.top + rect.height / 2;
                    const mouseOffsetX = (mouseX - targetCenterX) * parallaxStrength;
                    const mouseOffsetY = (mouseY - targetCenterY) * parallaxStrength;

                    tlOffset.x += mouseOffsetX;
                    tlOffset.y += mouseOffsetY;
                    trOffset.x += mouseOffsetX;
                    trOffset.y += mouseOffsetY;
                    brOffset.x += mouseOffsetX;
                    brOffset.y += mouseOffsetY;
                    blOffset.x += mouseOffsetX;
                    blOffset.y += mouseOffsetY;
                }

                const tl = gsap.timeline();
                const corners = [tlc, trc, brc, blc];
                const offsets = [tlOffset, trOffset, brOffset, blOffset];

                corners.forEach((corner, index) => {
                    tl.to(
                        corner,
                        {
                            x: offsets[index].x,
                            y: offsets[index].y,
                            duration: 0.2,
                            ease: 'power2.out'
                        },
                        0
                    );
                });
            };

            isAnimatingToTarget = true;
            updateCorners();

            setTimeout(() => {
                isAnimatingToTarget = false;
            }, 1);

            let moveThrottle: number | null = null;
            const targetMove = (ev: MouseEvent) => {
                if (moveThrottle || isAnimatingToTarget) return;
                moveThrottle = requestAnimationFrame(() => {
                    const mouseEvent = ev;
                    updateCorners(mouseEvent.clientX, mouseEvent.clientY);
                    moveThrottle = null;
                });
            };

            const leaveHandler = () => {
                activeTarget = null;
                isAnimatingToTarget = false;

                if (cornersRef.current) {
                    const corners = Array.from(cornersRef.current);
                    gsap.killTweensOf(corners);

                    const { cornerSize } = constants;
                    const positions = [
                        { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
                        { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
                        { x: cornerSize * 0.5, y: cornerSize * 0.5 },
                        { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
                    ];

                    const tl = gsap.timeline();
                    corners.forEach((corner, index) => {
                        tl.to(
                            corner,
                            {
                                x: positions[index].x,
                                y: positions[index].y,
                                duration: 0.3,
                                ease: 'power3.out'
                            },
                            0
                        );
                    });
                }

                resumeTimeout = setTimeout(() => {
                    if (!activeTarget && cursorRef.current && spinTl.current) {
                        const currentRotation = gsap.getProperty(cursorRef.current, 'rotation') as number;
                        const normalizedRotation = currentRotation % 360;

                        spinTl.current.kill();
                        spinTl.current = gsap
                            .timeline({ repeat: -1 })
                            .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });

                        gsap.to(cursorRef.current, {
                            rotation: normalizedRotation + 360,
                            duration: spinDuration * (1 - normalizedRotation / 360),
                            ease: 'none',
                            onComplete: () => {
                                spinTl.current?.restart();
                            }
                        });
                    }
                    resumeTimeout = null;
                }, 50);

                cleanupTarget(target);
            };

            currentTargetMove = targetMove;
            currentLeaveHandler = leaveHandler;

            target.addEventListener('mousemove', targetMove);
            target.addEventListener('mouseleave', leaveHandler);
        };

        window.addEventListener('mouseover', enterHandler, { passive: true });

        return () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseover', enterHandler);
            window.removeEventListener('scroll', scrollHandler);
            window.removeEventListener('mousedown', mouseDownHandler);
            window.removeEventListener('mouseup', mouseUpHandler);

            if (activeTarget) {
                cleanupTarget(activeTarget);
            }

            if (resumeTimeout) {
                clearTimeout(resumeTimeout);
            }

            spinTl.current?.kill();
            document.body.style.cursor = originalCursor;
        };
    }, [targetSelector, spinDuration, moveCursor, constants, hideDefaultCursor, isMobile]);

    useEffect(() => {
        // Don't run on mobile devices
        if (isMobile) {
            return;
        }

        if (!cursorRef.current || !spinTl.current) return;

        if (spinTl.current.isActive()) {
            spinTl.current.kill();
            spinTl.current = gsap
                .timeline({ repeat: -1 })
                .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });
        }
    }, [spinDuration, isMobile]);

    // Don't render cursor on mobile devices (after all hooks)
    if (isMobile) {
        return null;
    }

    return (
        <div
            ref={cursorRef}
            className="fixed top-0 left-0 w-0 h-0 pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2"
            style={{
                willChange: 'transform',
                animation: 'cursorGlow 2s ease-in-out infinite alternate'
            }}
        >
            {/* Center dot */}
            <div
                ref={dotRef}
                className="target-cursor-dot absolute left-1/2 top-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                    willChange: 'transform',
                    boxShadow: `
                        0 0 4px rgba(255, 255, 255, 0.9), 
                        0 0 8px rgba(255, 255, 255, 0.9), 
                        0 0 16px rgba(255, 255, 255, 0.9),
                        0 0 4px rgba(0, 0, 0, 0.8), 
                        0 0 8px rgba(0, 0, 0, 0.8), 
                        0 0 16px rgba(0, 0, 0, 0.8)
                    `
                }}
            />

            {/* Top-left corner */}
            <div
                className="target-cursor-corner absolute left-1/2 top-1/2 w-3 h-3 border-[3px] border-white transform -translate-x-[150%] -translate-y-[150%] border-r-0 border-b-0"
                style={{
                    willChange: 'transform',
                    filter: `
                        drop-shadow(0 0 2px rgba(255, 255, 255, 0.9)) 
                        drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)) 
                        drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                        drop-shadow(0 0 2px rgba(0, 0, 0, 0.8)) 
                        drop-shadow(0 0 4px rgba(0, 0, 0, 0.8)) 
                        drop-shadow(0 0 8px rgba(0, 0, 0, 0.8))
                    `
                }}
            />

            {/* Top-right corner */}
            <div
                className="target-cursor-corner absolute left-1/2 top-1/2 w-3 h-3 border-[3px] border-white transform translate-x-1/2 -translate-y-[150%] border-l-0 border-b-0"
                style={{
                    willChange: 'transform',
                    filter: `
                        drop-shadow(0 0 2px rgba(255, 255, 255, 0.9)) 
                        drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)) 
                        drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                        drop-shadow(0 0 2px rgba(0, 0, 0, 0.8)) 
                        drop-shadow(0 0 4px rgba(0, 0, 0, 0.8)) 
                        drop-shadow(0 0 8px rgba(0, 0, 0, 0.8))
                    `
                }}
            />

            {/* Bottom-right corner */}
            <div
                className="target-cursor-corner absolute left-1/2 top-1/2 w-3 h-3 border-[3px] border-white transform translate-x-1/2 translate-y-1/2 border-l-0 border-t-0"
                style={{
                    willChange: 'transform',
                    filter: `
                        drop-shadow(0 0 2px rgba(255, 255, 255, 0.9)) 
                        drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)) 
                        drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                        drop-shadow(0 0 2px rgba(0, 0, 0, 0.8)) 
                        drop-shadow(0 0 4px rgba(0, 0, 0, 0.8)) 
                        drop-shadow(0 0 8px rgba(0, 0, 0, 0.8))
                    `
                }}
            />

            {/* Bottom-left corner */}
            <div
                className="target-cursor-corner absolute left-1/2 top-1/2 w-3 h-3 border-[3px] border-white transform -translate-x-[150%] translate-y-1/2 border-r-0 border-t-0"
                style={{
                    willChange: 'transform',
                    filter: `
                        drop-shadow(0 0 2px rgba(255, 255, 255, 0.9)) 
                        drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)) 
                        drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                        drop-shadow(0 0 2px rgba(0, 0, 0, 0.8)) 
                        drop-shadow(0 0 4px rgba(0, 0, 0, 0.8)) 
                        drop-shadow(0 0 8px rgba(0, 0, 0, 0.8))
                    `
                }}
            />
        </div>
    );
};

export default TargetCursor;
