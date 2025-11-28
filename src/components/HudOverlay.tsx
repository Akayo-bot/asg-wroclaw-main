import React from "react";
import { Battery, Signal, Wifi, Activity } from "lucide-react";

type HudOverlayProps = {
    opacity?: number;       // загальна прозорість HUD (0..1)
    showGrid?: boolean;     // тонка сітка
    showScan?: boolean;     // м'який "скан" зверху вниз
    compact?: boolean;      // менше елементів
};

export default function HudOverlay({
    opacity = 0.08,
    showGrid = true,
    showScan = true,
    compact = false,
}: HudOverlayProps) {
    return (
        <div
            className="pointer-events-none absolute inset-0 select-none"
            style={{ opacity }}
            aria-hidden
        >
            {/* 1) Тонка сітка */}
            {showGrid && (
                <svg className="absolute inset-0" role="img">
                    <defs>
                        <pattern id="hud-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="currentColor" strokeWidth="0.6" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hud-grid)" className="text-emerald-300" />
                </svg>
            )}

            {/* 2) Скан-лінія (дуже м'яка) */}
            {showScan && (
                <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
                    <div className="absolute inset-x-0 -top-full h-full animate-hud-scan bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent" />
                </div>
            )}

            {/* 3) Верхній HUD: ONLINE, сигнал, батарея */}
            <div className="absolute right-4 top-3 flex items-center gap-3 text-emerald-200">
                <span className="inline-flex items-center gap-1 text-[11px] tracking-wider">
                    <span className="relative inline-flex h-2 w-2">
                        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-90" />
                        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
                    </span>
                    ONLINE
                </span>
                {!compact && (
                    <>
                        <span className="inline-flex items-center gap-1 text-[11px]">
                            <Signal className="h-3.5 w-3.5" /> 4/4
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px]">
                            <Wifi className="h-3.5 w-3.5" /> 5G
                        </span>
                    </>
                )}
                <span className="inline-flex items-center gap-1 text-[11px]">
                    <Battery className="h-3.5 w-3.5" /> 92%
                </span>
            </div>

            {/* 4) Нижня панель: координати + курс */}
            <div className="absolute bottom-3 left-4 flex items-center gap-3 text-emerald-200">
                <span className="text-[11px]">LAT 51.1079°N</span>
                <span className="text-[11px]">LON 17.0385°E</span>
                {!compact && (
                    <>
                        <span className="text-[11px]">ALT 123m</span>
                        <span className="inline-flex items-center gap-1 text-[11px]">
                            <Activity className="h-3.5 w-3.5" />
                            CURS 034°
                        </span>
                    </>
                )}
            </div>

            {/* 5) Плаваючі маркери-брекети по краях (як у навбарі) */}
            <CornerBrackets />

            {/* 6) Блимаючі датчики */}
            <div className="absolute left-6 top-10">
                <span className="block h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-ping" />
            </div>
            <div className="absolute right-10 bottom-8">
                <span className="block h-1.5 w-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
            </div>
        </div>
    );
}

function CornerBrackets() {
    const base = "absolute text-emerald-400/70";
    return (
        <>
            <div className={`${base} left-2 top-2`}>
                <div className="h-[2px] w-8 bg-emerald-400/60" />
                <div className="h-8 w-[2px] bg-emerald-400/60" />
            </div>
            <div className={`${base} right-2 top-2`}>
                <div className="ml-auto h-[2px] w-8 bg-emerald-400/60" />
                <div className="ml-auto h-8 w-[2px] bg-emerald-400/60" />
            </div>
            <div className={`${base} left-2 bottom-2`}>
                <div className="h-[2px] w-8 bg-emerald-400/60" />
                <div className="h-8 w-[2px] bg-emerald-400/60" />
            </div>
            <div className={`${base} right-2 bottom-2`}>
                <div className="ml-auto h-[2px] w-8 bg-emerald-400/60" />
                <div className="ml-auto h-8 w-[2px] bg-emerald-400/60" />
            </div>
        </>
    );
}



















