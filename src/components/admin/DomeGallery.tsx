import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';

interface ImageItem {
    src: string;
    alt: string;
    fullSrc?: string;
}

interface DomeGalleryProps {
    images?: ImageItem[] | string[];
    fit?: number;
    fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
    minRadius?: number;
    maxRadius?: number;
    padFactor?: number;
    overlayBlurColor?: string;
    maxVerticalRotationDeg?: number;
    dragSensitivity?: number;
    enlargeTransitionMs?: number;
    segments?: number;
    dragDampening?: number;
    openedImageWidth?: string;
    openedImageHeight?: string;
    imageBorderRadius?: string;
    openedImageBorderRadius?: string;
    grayscale?: boolean;
    isMobile?: boolean;
}

const DEFAULTS = {
    maxVerticalRotationDeg: 5,
    dragSensitivity: 20,
    enlargeTransitionMs: 300,
    segments: 35
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => {
    const a = (((deg + 180) % 360) + 360) % 360;
    return a - 180;
};

const getDataNumber = (el: HTMLElement, name: string, fallback: number): number => {
    const attr = (el as any).dataset[name] ?? el.getAttribute(`data-${name}`);
    const n = attr == null ? NaN : parseFloat(attr);
    return Number.isFinite(n) ? n : fallback;
};

function buildItems(pool: ImageItem[] | string[], seg: number) {
    const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];

    const coords = xCols.flatMap((x, c) => {
        const ys = c % 2 === 0 ? evenYs : oddYs;
        return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
    });

    const totalSlots = coords.length;
    if (pool.length === 0) {
        return coords.map(c => ({ ...c, src: '', alt: '' }));
    }
    if (pool.length > totalSlots) {
        console.warn(
            `[DomeGallery] Provided image count (${pool.length}) exceeds available tiles (${totalSlots}). Some images will not be shown.`
        );
    }

    const normalizedImages: ImageItem[] = pool.map(image => {
        if (typeof image === 'string') {
            return { src: image, alt: '' };
        }
        return { 
            src: image.src || '', 
            alt: image.alt || '',
            fullSrc: image.fullSrc 
        };
    });

    const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

    for (let i = 1; i < usedImages.length; i++) {
        if (usedImages[i].src === usedImages[i - 1].src) {
            for (let j = i + 1; j < usedImages.length; j++) {
                if (usedImages[j].src !== usedImages[i].src) {
                    const tmp = usedImages[i];
                    usedImages[i] = usedImages[j];
                    usedImages[j] = tmp;
                    break;
                }
            }
        }
    }

    return coords.map((c, i) => ({
        ...c,
        src: usedImages[i].src,
        alt: usedImages[i].alt,
        fullSrc: usedImages[i].fullSrc
    }));
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
    const unit = 360 / segments / 2;
    const rotateY = unit * (offsetX + (sizeX - 1) / 2);
    const rotateX = unit * (offsetY - (sizeY - 1) / 2);
    return { rotateX, rotateY };
}

export default function DomeGallery({
    images = [],
    fit = 0.5,
    fitBasis = 'auto',
    minRadius = 600,
    maxRadius = Infinity,
    padFactor = 0.25,
    overlayBlurColor = '#060010',
    maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
    dragSensitivity = DEFAULTS.dragSensitivity,
    enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
    segments = DEFAULTS.segments,
    dragDampening = 2,
    openedImageWidth = '400px',
    openedImageHeight = '400px',
    imageBorderRadius = '30px',
    openedImageBorderRadius = '30px',
    grayscale = false,
    isMobile = false
}: DomeGalleryProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);
    const sphereRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const scrimRef = useRef<HTMLDivElement>(null);
    const focusedElRef = useRef<HTMLElement | null>(null);
    const originalTilePositionRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

    const rotationRef = useRef({ x: 0, y: 0 });
    const startRotRef = useRef({ x: 0, y: 0 });
    const startPosRef = useRef<{ x: number; y: number } | null>(null);
    const draggingRef = useRef(false);
    const cancelTapRef = useRef(false);
    const movedRef = useRef(false);
    const inertiaRAF = useRef<number | null>(null);
    const pointerTypeRef = useRef<string>('mouse');
    const tapTargetRef = useRef<HTMLElement | null>(null);
    const openingRef = useRef(false);
    const openStartedAtRef = useRef(0);
    const lastDragEndAt = useRef(0);
    const touchStartRef = useRef<{ x: number; y: number; time: number; target: HTMLElement | null } | null>(null);



    const scrollLockedRef = useRef(false);
    const scrollPositionRef = useRef(0);
    const previousStylesRef = useRef<{ bodyOverflow: string; htmlOverflow: string; bodyTouchAction: string }>({
        bodyOverflow: '',
        htmlOverflow: '',
        bodyTouchAction: ''
    });
    const lockScroll = useCallback(() => {
        if (scrollLockedRef.current) return;
        scrollLockedRef.current = true;
        scrollPositionRef.current = window.scrollY;

        previousStylesRef.current = {
            bodyOverflow: document.body.style.overflow,
            htmlOverflow: document.documentElement.style.overflow,
            bodyTouchAction: (document.body.style as CSSStyleDeclaration & { touchAction?: string }).touchAction || ''
        };

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        (document.body.style as CSSStyleDeclaration & { touchAction?: string }).touchAction = 'none';
        window.scrollTo(0, scrollPositionRef.current);
    }, []);
    const unlockScroll = useCallback(() => {
        if (!scrollLockedRef.current) return;
        if (rootRef.current?.getAttribute('data-enlarging') === 'true') return;
        scrollLockedRef.current = false;

        document.documentElement.style.overflow = previousStylesRef.current.htmlOverflow;
        document.body.style.overflow = previousStylesRef.current.bodyOverflow;
        (document.body.style as CSSStyleDeclaration & { touchAction?: string }).touchAction =
            previousStylesRef.current.bodyTouchAction;
        window.scrollTo(0, scrollPositionRef.current);
    }, []);

    const items = useMemo(() => buildItems(images, segments), [images, segments]);

    const transformRAFRef = useRef<number | null>(null);
    const pendingTransformRef = useRef<{ x: number; y: number } | null>(null);

    const applyTransform = useCallback((xDeg: number, yDeg: number) => {
        pendingTransformRef.current = { x: xDeg, y: yDeg };

        if (transformRAFRef.current === null) {
            transformRAFRef.current = requestAnimationFrame(() => {
                const pending = pendingTransformRef.current;
                if (pending) {
                    const el = sphereRef.current;
                    if (el) {
                        el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${pending.x}deg) rotateY(${pending.y}deg)`;
                    }
                }
                transformRAFRef.current = null;
                pendingTransformRef.current = null;
            });
        }
    }, []);

    const lockedRadiusRef = useRef<number | null>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const ro = new ResizeObserver(entries => {
            const cr = entries[0].contentRect;
            const w = Math.max(1, cr.width),
                h = Math.max(1, cr.height);
            const minDim = Math.min(w, h),
                maxDim = Math.max(w, h),
                aspect = w / h;
            let basis: number;
            switch (fitBasis) {
                case 'min':
                    basis = minDim;
                    break;
                case 'max':
                    basis = maxDim;
                    break;
                case 'width':
                    basis = w;
                    break;
                case 'height':
                    basis = h;
                    break;
                default:
                    basis = aspect >= 1.3 ? w : minDim;
            }
            let radius = basis * fit;
            const heightGuard = h * 1.35;
            radius = Math.min(radius, heightGuard);
            radius = clamp(radius, minRadius, maxRadius);
            lockedRadiusRef.current = Math.round(radius);

            const viewerPad = Math.max(8, Math.round(minDim * padFactor));

            root.style.setProperty('--radius', `${lockedRadiusRef.current}px`);
            root.style.setProperty('--viewer-pad', `${viewerPad}px`);
            root.style.setProperty('--overlay-blur-color', overlayBlurColor);
            root.style.setProperty('--tile-radius', imageBorderRadius);
            root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
            root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');

            applyTransform(rotationRef.current.x, rotationRef.current.y);

            const enlargedOverlay = viewerRef.current?.querySelector('.enlarge') as HTMLElement;
            if (enlargedOverlay && frameRef.current && mainRef.current) {
                const frameR = frameRef.current.getBoundingClientRect();
                const mainR = mainRef.current.getBoundingClientRect();

                const hasCustomSize = openedImageWidth && openedImageHeight;
                if (hasCustomSize) {
                    const tempDiv = document.createElement('div');
                    tempDiv.style.cssText = `position: absolute; width: ${openedImageWidth}; height: ${openedImageHeight}; visibility: hidden;`;
                    document.body.appendChild(tempDiv);
                    const tempRect = tempDiv.getBoundingClientRect();
                    document.body.removeChild(tempDiv);

                    const centeredLeft = frameR.left - mainR.left + (frameR.width - tempRect.width) / 2;
                    const centeredTop = frameR.top - mainR.top + (frameR.height - tempRect.height) / 2;

                    enlargedOverlay.style.left = `${centeredLeft}px`;
                    enlargedOverlay.style.top = `${centeredTop}px`;
                } else {
                    enlargedOverlay.style.left = `${frameR.left - mainR.left}px`;
                    enlargedOverlay.style.top = `${frameR.top - mainR.top}px`;
                    enlargedOverlay.style.width = `${frameR.width}px`;
                    enlargedOverlay.style.height = `${frameR.height}px`;
                }
            }
        });
        ro.observe(root);
        return () => ro.disconnect();
    }, [
        fit,
        fitBasis,
        minRadius,
        maxRadius,
        padFactor,
        overlayBlurColor,
        grayscale,
        imageBorderRadius,
        openedImageBorderRadius,
        openedImageWidth,
        openedImageHeight
    ]);

    useEffect(() => {
        applyTransform(rotationRef.current.x, rotationRef.current.y);
    }, []);

    const stopInertia = useCallback(() => {
        if (inertiaRAF.current) {
            cancelAnimationFrame(inertiaRAF.current);
            inertiaRAF.current = null;
        }
    }, []);

    const startInertia = useCallback(
        (vx: number, vy: number) => {
            const MAX_V = 1.4;
            let vX = clamp(vx, -MAX_V, MAX_V) * 80;
            let vY = clamp(vy, -MAX_V, MAX_V) * 80;
            let frames = 0;
            const d = clamp(dragDampening ?? 0.6, 0, 1);
            const frictionMul = 0.94 + 0.055 * d;
            const stopThreshold = 0.015 - 0.01 * d;
            const maxFrames = Math.round(90 + 270 * d);
            const step = () => {
                vX *= frictionMul;
                vY *= frictionMul;
                if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
                    inertiaRAF.current = null;
                    return;
                }
                if (++frames > maxFrames) {
                    inertiaRAF.current = null;
                    return;
                }
                const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
                const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
                rotationRef.current = { x: nextX, y: nextY };
                applyTransform(nextX, nextY);
                inertiaRAF.current = requestAnimationFrame(step);
            };
            stopInertia();
            inertiaRAF.current = requestAnimationFrame(step);
        },
        [dragDampening, maxVerticalRotationDeg, stopInertia]
    );


    const openItemFromElement = useCallback(
        (el: HTMLElement) => {
            if (openingRef.current) return;
            openingRef.current = true;
            openStartedAtRef.current = performance.now();
            lockScroll();

            const parent = el.parentElement;
            if (!parent) {
                openingRef.current = false;
                unlockScroll();
                return;
            }

            focusedElRef.current = el;
            el.setAttribute('data-focused', 'true');

            const offsetX = getDataNumber(parent, 'offsetX', 0);
            const offsetY = getDataNumber(parent, 'offsetY', 0);
            const sizeX = getDataNumber(parent, 'sizeX', 2);
            const sizeY = getDataNumber(parent, 'sizeY', 2);

            const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
            const parentY = normalizeAngle(parentRot.rotateY);
            const globalY = normalizeAngle(rotationRef.current.y);
            let rotY = -(parentY + globalY) % 360;
            if (rotY < -180) rotY += 360;
            const rotX = -parentRot.rotateX - rotationRef.current.x;

            parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
            parent.style.setProperty('--rot-x-delta', `${rotX}deg`);

            const refDiv = document.createElement('div');
            refDiv.className = 'item__image item__image--reference opacity-0';
            refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
            parent.appendChild(refDiv);

            void refDiv.offsetHeight;

            const tileR = refDiv.getBoundingClientRect();
            const mainR = mainRef.current?.getBoundingClientRect();
            const frameR = frameRef.current?.getBoundingClientRect();

            if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
                openingRef.current = false;
                focusedElRef.current = null;
                parent.removeChild(refDiv);
                unlockScroll();
                return;
            }

            originalTilePositionRef.current = {
                left: tileR.left,
                top: tileR.top,
                width: tileR.width,
                height: tileR.height
            };

            el.style.visibility = 'hidden';
            el.style.zIndex = '0';

            const rawSrc = (parent as any).dataset.fullSrc || (parent as any).dataset.src || el.querySelector('img')?.getAttribute('src') || '';
            const rawAlt = (parent as any).dataset.alt || el.querySelector('img')?.getAttribute('alt') || '';

            // Calculate dynamic dimensions based on aspect ratio for desktop
            let finalWidth = openedImageWidth;
            let finalHeight = openedImageHeight;
            let targetWidthNum = frameR.width;
            let targetHeightNum = frameR.height;

            if (!isMobile) {
                const thumbImg = el.querySelector('img');
                if (thumbImg && thumbImg.naturalWidth && thumbImg.naturalHeight) {
                    const maxDim = 420; // Max dimension for desktop
                    const ratio = thumbImg.naturalWidth / thumbImg.naturalHeight;
                    
                    if (ratio > 1) {
                        // Landscape
                        targetWidthNum = maxDim;
                        targetHeightNum = maxDim / ratio;
                        finalWidth = `${targetWidthNum}px`;
                        finalHeight = `${targetHeightNum}px`;
                    } else {
                        // Portrait or Square
                        targetHeightNum = maxDim;
                        targetWidthNum = maxDim * ratio;
                        finalHeight = `${targetHeightNum}px`;
                        finalWidth = `${targetWidthNum}px`;
                    }
                }
            } else {
                // Mobile: Calculate pixel values from vw/vh for accurate centering
                if (typeof openedImageWidth === 'string' && openedImageWidth.endsWith('vw')) {
                    targetWidthNum = window.innerWidth * (parseFloat(openedImageWidth) / 100);
                }
                if (typeof openedImageHeight === 'string' && openedImageHeight.endsWith('vh')) {
                    targetHeightNum = window.innerHeight * (parseFloat(openedImageHeight) / 100);
                }
            }

            const overlay = document.createElement('div');
            overlay.className = 'enlarge';
            
            // Common overlay styles - use calculated dimensions immediately
            overlay.style.width = finalWidth || frameR.width + 'px';
            overlay.style.height = finalHeight || frameR.height + 'px';
            overlay.style.opacity = '0';
            overlay.style.willChange = 'transform, opacity';
            overlay.style.transformOrigin = 'top left';
            // Removed clip-path from transition for performance
            overlay.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease, border-radius ${enlargeTransitionMs}ms ease`;
            overlay.style.borderRadius = openedImageBorderRadius;
            overlay.style.overflow = 'hidden';
            overlay.style.setProperty('border-radius', openedImageBorderRadius, 'important');
            overlay.style.setProperty('overflow', 'hidden', 'important');
            // Removed clip-path setting
            overlay.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';

            // Create image container using background-image for proper border-radius clipping
            const imgContainer = document.createElement('div');
            imgContainer.setAttribute('role', 'img');
            imgContainer.setAttribute('aria-label', rawAlt);
            imgContainer.style.width = '100%';
            imgContainer.style.height = '100%';
            imgContainer.style.backgroundImage = `url("${rawSrc}")`;
            imgContainer.style.backgroundSize = isMobile ? 'cover' : 'contain';
            imgContainer.style.backgroundPosition = 'center';
            imgContainer.style.backgroundRepeat = 'no-repeat';
            imgContainer.style.filter = grayscale ? 'grayscale(1)' : 'none';
            
            overlay.appendChild(imgContainer);
            
            
            // Mobile: Global overlay with backdrop
            if (isMobile) {
                const backdrop = document.createElement('div');
                backdrop.className = 'enlarge-backdrop';
                backdrop.style.position = 'fixed';
                backdrop.style.inset = '0';
                backdrop.style.backgroundColor = 'rgba(0,0,0,0.8)';
                backdrop.style.zIndex = '9998';
                backdrop.style.opacity = '0';
                backdrop.style.transition = `opacity ${enlargeTransitionMs}ms ease`;
                backdrop.onclick = () => {
                    // Find the close button or trigger close logic
                    // Since 'close' is defined later, we can dispatch a custom event or use a ref if needed.
                    // But simpler: we can just call the close logic if we had access to it.
                    // Since we are inside useCallback, we can't easily call 'close' if it's defined outside or depends on this.
                    // Actually, 'close' depends on 'openingRef' etc.
                    // Let's use a global event or just rely on the fact that we can trigger a click on the scrim?
                    // No, scrim is behind.
                    // Let's dispatch a click on the overlay which we can handle? No.
                    // We need a way to trigger close.
                    // Let's assign a handler to the backdrop that calls a ref-stored close function?
                    // Or better: just dispatch a click to the scrimRef if it exists?
                    // scrimRef.current?.click(); // This might work if scrim has the click handler.
                    // Let's check where 'close' is used. It's used in 'useGesture' and 'useEffect'.
                    // We can expose 'close' via a ref or just duplicate the close trigger logic.
                    // Actually, the cleanest way is to just let the user tap the backdrop.
                    // We can add an event listener to the backdrop that calls the close function.
                    // But 'close' is defined inside the component scope, so we can't attach it here easily if it's defined *after*.
                    // Wait, 'close' is defined inside useEffect? No, it's usually a function.
                    // Ah, 'close' is NOT defined as a standalone function in the scope I can see yet.
                    // Let's look at the file content again. 'close' is likely defined inside a useEffect or as a useCallback.
                    // If it's not available here, we can use a custom event.
                    document.dispatchEvent(new CustomEvent('dome-gallery-close'));
                };
                document.body.appendChild(backdrop);
                
                // Force reflow to enable transition
                requestAnimationFrame(() => {
                    backdrop.style.opacity = '1';
                });


                overlay.style.position = 'fixed';
                overlay.style.left = frameR.left + 'px';
                overlay.style.top = frameR.top + 'px';
                overlay.style.zIndex = '9999';
                
                document.body.appendChild(overlay);
            } else {
                // Desktop: Local overlay (inside main container) with transparent backdrop
                const backdrop = document.createElement('div');
                backdrop.className = 'enlarge-backdrop';
                backdrop.style.position = 'fixed';
                backdrop.style.inset = '0';
                backdrop.style.backgroundColor = 'transparent'; // Transparent for desktop
                backdrop.style.zIndex = '9998';
                backdrop.style.opacity = '0';
                backdrop.style.transition = `opacity ${enlargeTransitionMs}ms ease`;
                backdrop.onclick = () => {
                    document.dispatchEvent(new CustomEvent('dome-gallery-close'));
                };
                document.body.appendChild(backdrop);
                
                // Force reflow to enable transition
                requestAnimationFrame(() => {
                    backdrop.style.opacity = '1';
                });

                overlay.style.position = 'absolute';
                overlay.style.zIndex = '30';
                
                if (mainRef.current) {
                    mainRef.current.appendChild(overlay);
                }
            }

            // Calculate centering based on new dimensions
            const overlayWidth = targetWidthNum;
            const overlayHeight = targetHeightNum;
            
            // Center the overlay in the frame or main container
            const centeredLeft = isMobile 
                ? frameR.left + (frameR.width - overlayWidth) / 2
                : frameR.left - mainR.left + (frameR.width - overlayWidth) / 2;
            const centeredTop = isMobile
                ? frameR.top + (frameR.height - overlayHeight) / 2
                : frameR.top - mainR.top + (frameR.height - overlayHeight) / 2;

            // Update overlay position to be centered
            overlay.style.left = centeredLeft + 'px';
            overlay.style.top = centeredTop + 'px';

            // Calculate transform from tile to centered overlay
            // tileR is absolute, centeredLeft/Top are relative to parent (body or main)
            // We need absolute position of the centered overlay
            const absOverlayLeft = isMobile ? centeredLeft : centeredLeft + mainR.left;
            const absOverlayTop = isMobile ? centeredTop : centeredTop + mainR.top;

            const tx0 = tileR.left - absOverlayLeft;
            const ty0 = tileR.top - absOverlayTop;
            
            const sx0 = tileR.width / overlayWidth;
            const sy0 = tileR.height / overlayHeight;

            const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
            const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;

            // Compensate border-radius for the scale
            const radiusNum = parseInt(openedImageBorderRadius) || 12;
            const minScale = Math.min(validSx0, validSy0);
            const compensatedRadius = `${radiusNum / minScale}px`;

            overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`;
            overlay.style.borderRadius = compensatedRadius;
            overlay.style.setProperty('border-radius', compensatedRadius, 'important');
            // Removed clip-path setting

            setTimeout(() => {
                if (!overlay.parentElement) return;
                overlay.style.opacity = '1';
                overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
                
                // Animate to normal radius
                overlay.style.borderRadius = openedImageBorderRadius;
                overlay.style.setProperty('border-radius', openedImageBorderRadius, 'important');
                // Removed clip-path setting

                rootRef.current?.setAttribute('data-enlarging', 'true');
            }, 16);
        },
        [
            lockScroll,
            unlockScroll,
            segments,
            enlargeTransitionMs,
            openedImageBorderRadius,
            grayscale,
            openedImageWidth,
            openedImageHeight,
            isMobile
        ]
    );

    useGesture(
        {
            onDragStart: ({ event }) => {
                if (focusedElRef.current) return;
                stopInertia();
                const evt = event as any; // Casting to any/PointerEvent
                draggingRef.current = true;
                movedRef.current = false;
                startRotRef.current = { ...rotationRef.current };
                startPosRef.current = { x: evt.clientX, y: evt.clientY };
            },
            onDrag: ({ event, last, velocity: velArr = [0, 0], direction: dirArr = [0, 0], movement }) => {
                if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;

                const evt = event as any;
                const dxTotal = evt.clientX - startPosRef.current.x;
                const dyTotal = evt.clientY - startPosRef.current.y;

                if (!movedRef.current) {
                    const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
                    if (dist2 > 16) movedRef.current = true;
                }

                const nextX = clamp(
                    startRotRef.current.x - dyTotal / dragSensitivity,
                    -maxVerticalRotationDeg,
                    maxVerticalRotationDeg
                );
                const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity);

                if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
                    rotationRef.current = { x: nextX, y: nextY };
                    applyTransform(nextX, nextY);
                }

                if (last) {
                    draggingRef.current = false;

                    let [vMagX, vMagY] = velArr;
                    const [dirX, dirY] = dirArr;
                    let vx = vMagX * dirX;
                    let vy = vMagY * dirY;

                    if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
                        const [mx, my] = movement;
                        vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2);
                        vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
                    }

                    if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
                        startInertia(vx, vy);
                    }

                    if (movedRef.current) lastDragEndAt.current = performance.now();

                    movedRef.current = false;
                }
            },
            onDragEnd: ({ event }) => {
                draggingRef.current = false;
                
                // Prevent opening if user just scrolled (check if drag ended recently)
                const timeSinceLastDrag = performance.now() - (lastDragEndAt.current || 0);
                if (timeSinceLastDrag < 300) {
                    // User just finished scrolling, don't open image
                    return;
                }
                
                // Handle tap to open (since onClick is unreliable on mobile due to global CSS overrides)
                if (!movedRef.current) {
                    const target = event.target as HTMLElement;
                    let imageEl = target.closest('.item__image');

                    // Fallback: if target is obscured (e.g. by scrim), use elementsFromPoint
                    if (!imageEl) {
                        const evt = event as any;
                        const clientX = evt.clientX || (evt.changedTouches && evt.changedTouches[0]?.clientX);
                        const clientY = evt.clientY || (evt.changedTouches && evt.changedTouches[0]?.clientY);
                        
                        if (clientX != null && clientY != null) {
                            const elements = document.elementsFromPoint(clientX, clientY);
                            for (const el of elements) {
                                if (el.classList.contains('item__image') || el.closest('.item__image')) {
                                    imageEl = el.closest('.item__image');
                                    break;
                                }
                            }
                        }
                    }

                    if (imageEl) {
                        openItemFromElement(imageEl as HTMLElement);
                    }
                }
            }
        },
        { target: mainRef, eventOptions: { passive: true } }
    );

    const onTileClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (draggingRef.current) return;
            if (movedRef.current) return;
            if (performance.now() - lastDragEndAt.current < 80) return;
            if (openingRef.current) return;
            openItemFromElement(e.currentTarget);
        },
        [openItemFromElement]
    );

    const onTilePointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType !== 'touch') return;
            if (draggingRef.current) return;
            if (movedRef.current) return;
            if (performance.now() - lastDragEndAt.current < 80) return;
            if (openingRef.current) return;
            openItemFromElement(e.currentTarget);
        },
        [openItemFromElement]
    );

    useEffect(() => {
        const scrim = scrimRef.current;
        if (!scrim) return;

        const close = () => {
            if (performance.now() - openStartedAtRef.current < 250) return;
            const el = focusedElRef.current;
            if (!el) return;
            const parent = el.parentElement;
            // Try to find overlay in body (mobile) or main container (desktop)
            const overlay = document.querySelector('.enlarge') as HTMLElement || mainRef.current?.querySelector('.enlarge') as HTMLElement;
            if (!overlay) return;

            const refDiv = parent?.querySelector('.item__image--reference');

            const originalPos = originalTilePositionRef.current;
            if (!originalPos) {
                overlay.remove();
                if (refDiv) refDiv.remove();
                parent?.style.setProperty('--rot-y-delta', `0deg`);
                parent?.style.setProperty('--rot-x-delta', `0deg`);
                el.style.visibility = '';
                el.style.zIndex = '0';
                focusedElRef.current = null;
                rootRef.current?.removeAttribute('data-enlarging');
                openingRef.current = false;
                unlockScroll();
                return;
            }

            const currentRect = overlay.getBoundingClientRect();
            const rootRect = rootRef.current?.getBoundingClientRect();
            if (!rootRect) return;

            const originalPosRelativeToRoot = {
                left: originalPos.left - rootRect.left,
                top: originalPos.top - rootRect.top,
                width: originalPos.width,
                height: originalPos.height
            };

            const overlayRelativeToRoot = {
                left: isMobile ? currentRect.left : currentRect.left - rootRect.left,
                top: isMobile ? currentRect.top : currentRect.top - rootRect.top,
                width: currentRect.width,
                height: currentRect.height
            };

            const animatingOverlay = document.createElement('div');
            animatingOverlay.className = 'enlarge-closing';
            animatingOverlay.style.cssText = `
        position: ${isMobile ? 'fixed' : 'absolute'};
        left: ${overlayRelativeToRoot.left}px;
        top: ${overlayRelativeToRoot.top}px;
        width: ${overlayRelativeToRoot.width}px;
        height: ${overlayRelativeToRoot.height}px;
        z-index: 9999;
        border-radius: ${openedImageBorderRadius};
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
        transition: left ${enlargeTransitionMs}ms ease-out, top ${enlargeTransitionMs}ms ease-out, width ${enlargeTransitionMs}ms ease-out, height ${enlargeTransitionMs}ms ease-out, opacity ${enlargeTransitionMs}ms ease-out, border-radius ${enlargeTransitionMs}ms ease-out;
        pointer-events: none;
        margin: 0;
        transform: none;
        filter: ${grayscale ? 'grayscale(1)' : 'none'};
      `;

            const originalImgContainer = overlay.querySelector('div[role="img"]');
            if (originalImgContainer) {
                const imgContainer = originalImgContainer.cloneNode(true) as HTMLElement;
                animatingOverlay.appendChild(imgContainer);
            }

            // Cleanup backdrop if it exists
            const backdrop = document.querySelector('.enlarge-backdrop');
            if (backdrop) {
                (backdrop as HTMLElement).style.opacity = '0';
                setTimeout(() => backdrop.remove(), enlargeTransitionMs);
            }

            overlay.remove();
            if (isMobile) {
                document.body.appendChild(animatingOverlay);
            } else if (rootRef.current) {
                rootRef.current.appendChild(animatingOverlay);
            }

            void animatingOverlay.getBoundingClientRect();

            // Calculate closing scale to compensate border-radius
            const startWidth = isMobile ? currentRect.width : currentRect.width;
            const endWidth = isMobile ? originalPos.width : originalPos.width;
            const scale = endWidth / startWidth;
            
            const radiusNum = parseInt(openedImageBorderRadius) || 12;
            const compensatedRadius = `${radiusNum / scale}px`;

            requestAnimationFrame(() => {
                animatingOverlay.style.left = (isMobile ? originalPos.left : originalPosRelativeToRoot.left) + 'px';
                animatingOverlay.style.top = (isMobile ? originalPos.top : originalPosRelativeToRoot.top) + 'px';
                animatingOverlay.style.width = (isMobile ? originalPos.width : originalPosRelativeToRoot.width) + 'px';
                animatingOverlay.style.height = (isMobile ? originalPos.height : originalPosRelativeToRoot.height) + 'px';
                animatingOverlay.style.opacity = '0';
                
                // Animate border-radius to compensated value so it looks constant visually
                animatingOverlay.style.borderRadius = compensatedRadius;
            });

            const cleanup = () => {
                animatingOverlay.remove();
                originalTilePositionRef.current = null;

                if (refDiv) refDiv.remove();
                parent?.style.setProperty('transition', 'none');
                el.style.transition = 'none';

                parent?.style.setProperty('--rot-y-delta', `0deg`);
                parent?.style.setProperty('--rot-x-delta', `0deg`);

                requestAnimationFrame(() => {
                    el.style.visibility = '';
                    el.style.opacity = '0';
                    el.style.zIndex = '0';
                    focusedElRef.current = null;
                    rootRef.current?.removeAttribute('data-enlarging');

                    requestAnimationFrame(() => {
                        parent?.style.setProperty('transition', '');
                        el.style.transition = 'opacity 300ms ease-out';

                        requestAnimationFrame(() => {
                            el.style.opacity = '1';
                            setTimeout(() => {
                                el.style.transition = '';
                                el.style.opacity = '';
                                openingRef.current = false;
                                if (!draggingRef.current && rootRef.current?.getAttribute('data-enlarging') !== 'true')
                                    document.body.classList.remove('dg-scroll-lock');
                                unlockScroll();
                            }, 300);
                        });
                    });
                });
            };

            animatingOverlay.addEventListener('transitionend', cleanup, {
                once: true
            });
        };

        scrim.addEventListener('click', close);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            scrim.removeEventListener('click', close);
            window.removeEventListener('keydown', onKey);
        };
    }, [enlargeTransitionMs, openedImageBorderRadius, grayscale, unlockScroll, isMobile]);

    // Listen for custom close event from backdrop
    useEffect(() => {
        const handleClose = () => {
            const scrim = scrimRef.current;
            if (scrim) {
                scrim.click(); // Trigger the existing close logic
            }
        };
        document.addEventListener('dome-gallery-close', handleClose);
        return () => document.removeEventListener('dome-gallery-close', handleClose);
    }, []);



    useEffect(() => {
        return () => {
            document.body.classList.remove('dg-scroll-lock');
            // Cleanup для RAF
            if (transformRAFRef.current) {
                cancelAnimationFrame(transformRAFRef.current);
                transformRAFRef.current = null;
            }
        };
    }, []);

    const cssStyles = `
    .sphere-root {
      --radius: 520px;
      --viewer-pad: 72px;
      --circ: calc(var(--radius) * 3.14);
      --rot-y: calc((360deg / var(--segments-x)) / 2);
      --rot-x: calc((360deg / var(--segments-y)) / 2);
      --item-width: calc(var(--circ) / var(--segments-x));
      --item-height: calc(var(--circ) / var(--segments-y));
    }
    
    .sphere-root * {
      box-sizing: border-box;
    }
    .sphere, .sphere-item, .item__image { transform-style: preserve-3d; }
    
    .stage {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      position: absolute;
      inset: 0;
      margin: auto;
      perspective: calc(var(--radius) * 2);
      perspective-origin: 50% 50%;
    }
    
    .sphere {
      transform: translateZ(calc(var(--radius) * -1));
      will-change: transform;
      position: absolute;
    }
    
    .sphere-item {
      width: calc(var(--item-width) * var(--item-size-x));
      height: calc(var(--item-height) * var(--item-size-y));
      position: absolute;
      top: -999px;
      bottom: -999px;
      left: -999px;
      right: -999px;
      margin: auto;
      transform-origin: 50% 50%;
      backface-visibility: hidden;
      transition: transform 300ms;
      transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg))) 
                 rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg))) 
                 translateZ(var(--radius));
    }
    
    .sphere-root[data-enlarging="true"] .scrim {
      opacity: 1 !important;
      pointer-events: all !important;
    }
    
    @media (max-aspect-ratio: 1/1) {
      .viewer-frame {
        height: auto !important;
        width: 100% !important;
      }
    }
    
    .item__image {
      position: absolute;
      inset: 10px;
      border-radius: var(--tile-radius, 12px);
      overflow: hidden;
      cursor: pointer;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transition: transform 300ms;
      pointer-events: auto;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    .item__image--reference {
      position: absolute;
      inset: 10px;
      pointer-events: none;
    }
  `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
            <div
                ref={rootRef}
                className="sphere-root relative w-full h-full"
                style={{
                    ['--segments-x' as string]: segments,
                    ['--segments-y' as string]: segments,
                    ['--overlay-blur-color' as string]: overlayBlurColor,
                    ['--tile-radius' as string]: imageBorderRadius,
                    ['--enlarge-radius' as string]: openedImageBorderRadius,
                    ['--image-filter' as string]: grayscale ? 'grayscale(1)' : 'none'
                }}
            >
                <main
                    ref={mainRef}
                    className="absolute inset-0 grid place-items-center overflow-hidden select-none bg-transparent"
                    style={{
                        touchAction: 'none',
                        WebkitUserSelect: 'none'
                    }}
                >
                    <div className="stage">
                        <div ref={sphereRef} className="sphere">
                            {items.map((it, i) => (
                                <div
                                    key={`${it.x},${it.y},${i}`}
                                    className="sphere-item absolute m-auto"
                                    data-src={it.src}
                                    data-full-src={it.fullSrc}
                                    data-alt={it.alt}
                                    data-offset-x={it.x}
                                    data-offset-y={it.y}
                                    data-size-x={it.sizeX}
                                    data-size-y={it.sizeY}
                                    style={{
                                        ['--offset-x' as string]: it.x,
                                        ['--offset-y' as string]: it.y,
                                        ['--item-size-x' as string]: it.sizeX,
                                        ['--item-size-y' as string]: it.sizeY,
                                        top: '-999px',
                                        bottom: '-999px',
                                        left: '-999px',
                                        right: '-999px'
                                    }}
                                >
                                    <div
                                        className="item__image absolute block overflow-hidden cursor-pointer bg-gray-200 transition-transform duration-300"
                                        role="button"
                                        tabIndex={0}
                                        aria-label={it.alt || 'Open image'}
                                        onClick={onTileClick}
                                        onPointerUp={onTilePointerUp}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return false;
                                        }}
                                        style={{
                                            inset: '10px',
                                            borderRadius: `var(--tile-radius, ${imageBorderRadius})`,
                                            touchAction: 'none',
                                            backfaceVisibility: 'hidden',
                                            WebkitTouchCallout: 'none',
                                            userSelect: 'none',
                                            zIndex: 10, // Поднимаем над сценой
                                            pointerEvents: 'auto' // Явно включаем события
                                        }}
                                    >
                                        <img
                                            src={it.src}
                                            draggable={false}
                                            alt={it.alt}
                                            className="w-full h-full object-cover pointer-events-none"
                                            style={{
                                                backfaceVisibility: 'hidden',
                                                filter: `var(--image-filter, ${grayscale ? 'grayscale(1)' : 'none'})`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className="absolute inset-0 m-auto z-[3] pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(rgba(235, 235, 235, 0) 65%, var(--overlay-blur-color, ${overlayBlurColor}) 100%)`
                        }}
                    />

                    <div
                        className="absolute inset-0 m-auto z-[3] pointer-events-none"
                        style={{
                            WebkitMaskImage: `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`,
                            maskImage: `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`,
                            backdropFilter: 'blur(3px)'
                        }}
                    />

                    <div
                        className="absolute left-0 right-0 top-0 h-[120px] z-[5] pointer-events-none rotate-180"
                        style={{
                            background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))`
                        }}
                    />
                    <div
                        className="absolute left-0 right-0 bottom-0 h-[120px] z-[5] pointer-events-none"
                        style={{
                            background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))`
                        }}
                    />

                    <div
                        ref={viewerRef}
                        className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
                        style={{ padding: 'var(--viewer-pad)' }}
                    >
                        <div
                            ref={(el) => {
                                scrimRef.current = el;
                                if (el) el.style.setProperty('pointer-events', 'none', 'important');
                            }}
                            className="scrim absolute inset-0 z-10 pointer-events-none opacity-0 transition-opacity duration-500"
                            style={{
                                background: 'rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(3px)'
                            }}
                        />
                        <div
                            ref={(el) => {
                                frameRef.current = el;
                                if (el) el.style.setProperty('pointer-events', 'none', 'important');
                            }}
                            className="viewer-frame h-full aspect-square flex pointer-events-none"
                            style={{ borderRadius: `var(--enlarge-radius, ${openedImageBorderRadius})` }}
                        />
                    </div>
                </main>
            </div>
        </>
    );
}

