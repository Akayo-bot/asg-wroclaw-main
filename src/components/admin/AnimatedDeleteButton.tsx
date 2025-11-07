import React, { useId } from 'react';

interface AnimatedDeleteButtonProps {
    onClick: () => void;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function AnimatedDeleteButton({
    onClick,
    className = '',
    size = 'md'
}: AnimatedDeleteButtonProps) {
    const maskId = useId();
    const sizeClasses = {
        xs: 'h-7 w-7',
        sm: 'h-10 w-10',
        md: 'h-12 w-12',
        lg: 'h-14 w-14'
    };

    const iconSize = {
        xs: '12',
        sm: '12',
        md: '15',
        lg: '16'
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative flex ${sizeClasses[size]} flex-col items-center justify-center overflow-hidden rounded-md border-2 border-rose-700/50 bg-rose-500/10 hover:bg-rose-500/20 transition-all duration-200 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(244,63,94,.35)] cursor-target ${className}`}
            aria-label="Видалити"
        >
            {/* Вращающаяся иконка X сверху */}
            <svg
                viewBox="0 0 1.625 1.625"
                className={`absolute fill-rose-300 delay-100 group-hover:animate-[spin_1.4s] group-hover:duration-1000 group-hover:drop-shadow-[0_0_6px_rgba(244,63,94,.8)] transition-all duration-300 ${size === 'xs'
                        ? '-top-5 group-hover:top-2'
                        : size === 'sm'
                            ? '-top-7 group-hover:top-4'
                            : '-top-7 group-hover:top-6'
                    }`}
                height={iconSize[size]}
                width={iconSize[size]}
            >
                <path
                    d="M.471 1.024v-.52a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099h-.39c-.107 0-.195 0-.195-.195"
                />
                <path
                    d="M1.219.601h-.163A.1.1 0 0 1 .959.504V.341A.033.033 0 0 0 .926.309h-.26a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099v-.39a.033.033 0 0 0-.032-.033"
                />
                <path
                    d="m1.245.465-.15-.15a.02.02 0 0 0-.016-.006.023.023 0 0 0-.023.022v.108c0 .036.029.065.065.065h.107a.023.023 0 0 0 .023-.023.02.02 0 0 0-.007-.016"
                />
            </svg>

            {/* Поворачивающаяся линия */}
            <svg
                width={iconSize[size]}
                fill="none"
                viewBox="0 0 39 7"
                className="origin-right duration-500 group-hover:rotate-90"
            >
                <line strokeWidth="4" stroke="currentColor" className="text-rose-300" y2="5" x2="39" y1="5" />
                <line
                    strokeWidth="3"
                    stroke="currentColor"
                    className="text-rose-300"
                    y2="1.5"
                    x2="26.0357"
                    y1="1.5"
                    x1="12"
                />
            </svg>

            {/* Иконка корзины */}
            <svg
                width={iconSize[size]}
                fill="none"
                viewBox="0 0 33 39"
                className="text-rose-300"
            >
                <mask fill="white" id={maskId}>
                    <path
                        d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"
                    />
                </mask>
                <path
                    mask={`url(#${maskId})`}
                    fill="currentColor"
                    className="text-rose-300"
                    d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                />
                <path strokeWidth="4" stroke="currentColor" className="text-rose-300" d="M12 6L12 29" />
                <path strokeWidth="4" stroke="currentColor" className="text-rose-300" d="M21 6V29" />
            </svg>
        </button>
    );
}

