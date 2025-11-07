import { ReactNode } from "react";
import { ShieldCheck, Sparkles, Circle } from "lucide-react";
import HudOverlay from "./HudOverlay";

interface HoloPanelProps {
    title?: string;
    status?: string;
    hasChanges?: boolean;
    children: ReactNode;
    hudOpacity?: number;
    compactHud?: boolean;
}

export function HoloPanel({ title = "Personal Information", status, hasChanges = false, children, hudOpacity = 0.08, compactHud = false }: HoloPanelProps) {
    const statusText = status || (hasChanges ? "Unsaved changes" : "All changes saved");

    return (
        <section className="relative rounded-2xl p-[1px] bg-gradient-to-b from-emerald-500/40 via-emerald-400/10 to-transparent overflow-hidden shadow-[0_0_0_1px_rgba(16,185,129,.25),0_20px_60px_-20px_rgba(16,185,129,.25)]">
            {/* голографический бордер */}
            <div className="relative rounded-2xl bg-[rgba(20,24,22,0.85)] backdrop-blur-md">
                {/* сканлайн */}
                <div className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
                    <div className="absolute inset-x-0 -top-full h-full animate-[scan_5s_linear_infinite] bg-gradient-to-b from-transparent via-emerald-400/6 to-transparent" />
                </div>

                {/* сетка */}
                <svg className="pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden>
                    <defs>
                        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.75" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" className="text-emerald-300" />
                </svg>

                {/* угловые скобы */}
                <Corners />

                {/* шапка */}
                <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-400/90" />
                        <h2 className="text-lg font-semibold tracking-wide text-emerald-100">{title}</h2>
                    </div>

                    <span className={`relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 transition-colors leading-none ${hasChanges
                        ? 'bg-yellow-500/10 text-yellow-300 ring-yellow-400/30'
                        : 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30'
                        }`}>
                        {hasChanges ? (
                            <>
                                <Circle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-pulse shrink-0" />
                                <span className="leading-none pl-5">{statusText}</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="h-4 w-4 shrink-0" />
                                <span className="leading-none">{statusText}</span>
                            </>
                        )}
                    </span>
                </div>

                {/* тонкий разделитель */}
                <div className={`mx-6 mb-4 h-px bg-gradient-to-r from-transparent via-${hasChanges ? 'yellow' : 'emerald'
                    }-500/40 to-transparent`} />

                {/* контент */}
                <div className="relative z-10 px-6 pb-6">{children}</div>

                {/* HUD Overlay */}
                <HudOverlay
                    opacity={hudOpacity}
                    showGrid
                    showScan
                    compact={compactHud}
                />
            </div>
        </section>
    );
}

function Corners() {
    const c = "absolute w-7 h-7 text-emerald-400/60";
    const line = "absolute bg-emerald-400/40";
    return (
        <>
            {/* top-left */}
            <div className={`${c} left-2 top-2`}>
                <span className={`${line} left-0 top-0 h-[2px] w-6`} />
                <span className={`${line} left-0 top-0 h-6 w-[2px]`} />
            </div>
            {/* top-right */}
            <div className={`${c} right-2 top-2`}>
                <span className={`${line} right-0 top-0 h-[2px] w-6`} />
                <span className={`${line} right-0 top-0 h-6 w-[2px]`} />
            </div>
            {/* bottom-left */}
            <div className={`${c} left-2 bottom-2`}>
                <span className={`${line} left-0 bottom-0 h-[2px] w-6`} />
                <span className={`${line} left-0 bottom-0 h-6 w-[2px]`} />
            </div>
            {/* bottom-right */}
            <div className={`${c} right-2 bottom-2`}>
                <span className={`${line} right-0 bottom-0 h-[2px] w-6`} />
                <span className={`${line} right-0 bottom-0 h-6 w-[2px]`} />
            </div>
        </>
    );
}

