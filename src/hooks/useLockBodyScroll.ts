import { useLayoutEffect, useRef } from 'react';

export function useLockBodyScroll(locked: boolean) {
    const originalBodyOverflow = useRef<string | null>(null);
    const originalHtmlOverflow = useRef<string | null>(null);

    useLayoutEffect(() => {
        // Сохраняем оригинальные значения только один раз
        if (originalBodyOverflow.current === null) {
            originalBodyOverflow.current = window.getComputedStyle(document.body).overflow;
            originalHtmlOverflow.current = window.getComputedStyle(document.documentElement).overflow;
        }

        if (locked) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            // Восстанавливаем оригинальные значения
            document.body.style.overflow = originalBodyOverflow.current || '';
            document.documentElement.style.overflow = originalHtmlOverflow.current || '';
        }

        return () => {
            // При размонтировании всегда восстанавливаем оригинальные значения
            document.body.style.overflow = originalBodyOverflow.current || '';
            document.documentElement.style.overflow = originalHtmlOverflow.current || '';
        };
    }, [locked]);
}

