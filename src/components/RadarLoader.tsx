import { useEffect, useRef } from 'react';
import '../styles/radar-loader.css';

interface RadarLoaderProps {
    label?: string;
    size?: number;
    className?: string;
}

interface Blip {
    el: HTMLDivElement;
    angle: number;
    radius: number;
    lastHit: number;
}

const RadarLoader = ({
    label = 'SCANNING TARGETS…',
    size = 140,
    className = ''
}: RadarLoaderProps) => {
    const radarRef = useRef<HTMLDivElement>(null);
    const sweepRef = useRef<HTMLDivElement>(null);
    const blipsRef = useRef<Blip[]>([]);
    const animationFrameRef = useRef<number>();
    const intervalsRef = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        if (!radarRef.current || !sweepRef.current) return;

        // Параметры радара
        const SWEEP_PERIOD = 3800;
        const BLIP_COUNT = 7;
        const ANGLE_WINDOW = 18;
        const LINGER_MS = 1100;
        const RESPAWN_EVERY = 9000;

        const radar = radarRef.current;
        const sweep = sweepRef.current;
        const radarSize = size;
        const R = radarSize / 2 - 9;

        const polarToXY = (angle: number, radius: number) => {
            const a = (angle - 90) * Math.PI / 180;
            return {
                x: R + Math.cos(a) * radius,
                y: R + Math.sin(a) * radius
            };
        };

        const placeBlip = (b: Blip) => {
            b.radius = Math.sqrt(Math.random()) * R * 0.9;
            b.angle = Math.random() * 360;
            const { x, y } = polarToXY(b.angle, b.radius);
            b.el.style.left = x + 'px';
            b.el.style.top = y + 'px';
            const s = 5 + Math.round(Math.random() * 3);
            b.el.style.width = b.el.style.height = s + 'px';
        };

        // Создаем блипы
        blipsRef.current = Array.from({ length: BLIP_COUNT }).map(() => {
            const el = document.createElement('div');
            el.className = 'radar-blip';
            const blip: Blip = {
                el,
                angle: 0,
                radius: 0,
                lastHit: -1
            };
            placeBlip(blip);
            radar.appendChild(el);
            return blip;
        });

        // Периодическое перемещение блипов
        const respawnInterval = setInterval(() => {
            const count = Math.max(2, Math.round(BLIP_COUNT * 0.3));
            const pick = [...blipsRef.current]
                .sort(() => Math.random() - 0.5)
                .slice(0, count);
            pick.forEach(placeBlip);
        }, RESPAWN_EVERY);

        intervalsRef.current.push(respawnInterval);

        // Анимация
        const start = performance.now();

        const frame = (now: number) => {
            const t = now - start;
            const angle = ((t % SWEEP_PERIOD) / SWEEP_PERIOD) * 360;
            sweep.style.transform = `rotate(${angle}deg)`;

            blipsRef.current.forEach(b => {
                const d = Math.abs(((angle - b.angle + 540) % 360) - 180);
                if (d <= ANGLE_WINDOW) {
                    b.lastHit = now;
                    b.el.classList.add('radar-blip-on');
                } else if (now - b.lastHit > LINGER_MS) {
                    b.el.classList.remove('radar-blip-on');
                }
            });

            animationFrameRef.current = requestAnimationFrame(frame);
        };

        animationFrameRef.current = requestAnimationFrame(frame);

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            intervalsRef.current.forEach(interval => clearInterval(interval));
            intervalsRef.current = [];
            blipsRef.current.forEach(b => b.el.remove());
            blipsRef.current = [];
        };
    }, [size]);

    return (
        <div className={`radar-loader-container ${className}`}>
            <div
                ref={radarRef}
                className="radar-loader"
                style={{
                    width: `${size}px`,
                    height: `${size}px`
                }}
            >
                <div ref={sweepRef} className="radar-sweep" />
            </div>
            <div className="radar-label">{label}</div>
        </div>
    );
};

export default RadarLoader;

