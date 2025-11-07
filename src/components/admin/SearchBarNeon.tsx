import { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";

export function SearchBarNeon({
    value,
    onChange,
    onSubmit,
    placeholder = "Пошук за заголовком або автором…",
}: {
    value: string;
    onChange: (v: string) => void;
    onSubmit?: () => void;
    placeholder?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const enterIconRef = useRef<HTMLElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isEnterAnimating, setIsEnterAnimating] = useState(false);

    const triggerAnimation = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsEnterAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
        setTimeout(() => setIsEnterAnimating(false), 400);
    };

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        triggerAnimation();
        onSubmit?.();
    };

    useEffect(() => {
        const input = inputRef.current;
        const btn = buttonRef.current;
        if (!input || !btn) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                triggerAnimation();
                btn.click();
            }
        };

        input.addEventListener("keydown", handleKeyDown);
        return () => input.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="group relative w-full max-w-4xl mx-auto mb-5">
            {/* фон/рамка */}
            <div
                className="absolute inset-0 rounded-2xl
                           bg-white/5 dark:bg-black/20
                           backdrop-blur-xl ring-1 ring-white/10 dark:ring-white/5
                           shadow-[0_8px_30px_rgba(0,0,0,.25)]
                           transition-all duration-300
                           group-focus-within:ring-[#46D6C8]/40
                           group-focus-within:shadow-[0_0_12px_rgba(70,214,200,.4),inset_0_0_12px_rgba(70,214,200,.15)]"
            />

            {/* мягкое свечение по периметру (как в навбаре) */}
            <span
                className="pointer-events-none absolute rounded-2xl inset-0 -z-10 opacity-0
                           ring-1 ring-[#46D6C8]/20
                           motion-safe:group-focus-within:animate-perimeter-glow
                           group-focus-within:opacity-100 transition-opacity duration-300"
            />

            {/* инпут + иконка + кнопка */}
            <div className="relative flex">
                {/* иконка */}
                <div
                    className="absolute left-3 top-1/2 -translate-y-1/2
                               grid place-items-center size-9 rounded-xl
                               bg-black/35 ring-1 ring-white/10
                               text-[#46D6C8]
                               shadow-[0_0_12px_rgba(70,214,200,.25)]
                               transition-all duration-300
                               group-focus-within:scale-110"
                >
                    <svg
                        className="size-[18px] transition-all duration-300 animate-none group-focus-within:animate-search-wiggle group-focus-within:scale-[1.2] group-focus-within:drop-shadow-[0_0_6px_rgba(70,214,200,.8)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.2-3.2" />
                    </svg>
                </div>

                {/* input */}
                <input
                    ref={inputRef}
                    id="articleSearch"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-12 md:h-14 rounded-l-2xl bg-transparent
                               pl-14 pr-28 text-slate-200 placeholder:text-slate-400/70
                               outline-none border-none"
                />

                {/* clear */}
                {value && (
                    <button
                        type="button"
                        aria-label="Очистити"
                        onClick={() => onChange("")}
                        className="absolute right-28 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                {/* кнопка как часть поля */}
                {onSubmit && (
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={handleButtonClick}
                        className={`btn-glass-emerald rounded-l-none h-12 md:h-14 px-5
                                   absolute right-0 top-0 rounded-r-2xl
                                   transition-transform active:scale-[.98] cursor-target
                                   ${isAnimating ? 'animate-button-press' : ''}`}
                    >
                        Шукати
                        <kbd 
                            ref={enterIconRef}
                            className={`ml-2 hidden md:inline-block text-xs px-1.5 py-0.5 rounded
                                     bg-black/40 ring-1 ring-white/10
                                     ${isEnterAnimating ? 'animate-enter-bounce' : ''}`}
                        >
                            Enter
                        </kbd>
                    </button>
                )}
            </div>
        </div>
    );
}

