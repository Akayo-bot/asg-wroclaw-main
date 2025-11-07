import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

    React.useEffect(() => {
        const checkMobile = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
            const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
            const noHover = window.matchMedia('(hover: none)').matches;

            // Consider mobile if ANY of these conditions are true
            return hasTouch || isSmallScreen || isCoarsePointer || noHover;
        };

        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = () => {
            setIsMobile(checkMobile());
        };

        mql.addEventListener("change", onChange);
        setIsMobile(checkMobile());

        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isMobile;
}
