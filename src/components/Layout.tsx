import { ReactNode, useEffect } from 'react';
import Header from '@/components/Header';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import TargetCursor from '@/components/TargetCursor';
import { autoTargetInteractiveElements } from '@/utils/autoTarget';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
    children: ReactNode;
    showBreadcrumbs?: boolean;
    showCustomCursor?: boolean;
    hideDefaultCursor?: boolean;
}

export const Layout = ({ children, showBreadcrumbs = false, showCustomCursor = true, hideDefaultCursor = true }: LayoutProps) => {
    const isMobile = useIsMobile();

    // Don't show custom cursor on mobile devices
    const shouldShowCursor = showCustomCursor && !isMobile;

    useEffect(() => {
        // Auto-target all interactive elements with delay to ensure DOM is ready
        // Only on desktop devices
        if (typeof window !== 'undefined' && document && !isMobile) {
            const timer = setTimeout(() => {
                const cleanup = autoTargetInteractiveElements();
                return cleanup;
            }, 100); // Small delay to ensure DOM is ready

            return () => clearTimeout(timer);
        }
    }, [isMobile]);

    // Re-process elements on DOM changes (Radix UI portals) - only on desktop
    useEffect(() => {
        if (typeof window === 'undefined' || !document || isMobile) return;

        // Re-process elements on DOM changes (for Radix UI portals)
        const handleDOMChanges = () => {
            // Add cursor-target only to interactive elements in Radix UI portals
            const portalElements = document.querySelectorAll(
                '[data-radix-portal] [role="menuitem"], ' +
                '[data-radix-portal] button, ' +
                '[data-radix-portal] a[href], ' +
                '[data-radix-portal] input, ' +
                '[data-radix-portal] select, ' +
                '[data-radix-portal] textarea, ' +
                '[data-radix-portal] [role="button"]'
            );
            portalElements.forEach(el => {
                if (!el.classList.contains('cursor-target')) {
                    el.classList.add('cursor-target');
                }
            });
        };

        // Run check with a small delay
        const timer = setTimeout(handleDOMChanges, 200);

        // Also track clicks (when menus open)
        const handleClick = () => {
            setTimeout(handleDOMChanges, 50);
        };

        document.addEventListener('click', handleClick);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClick);
        };
    }, [children, isMobile]); // Run when children or isMobile changes

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Target Cursor - Only on desktop devices */}
            {shouldShowCursor && (
                <TargetCursor
                    targetSelector=".cursor-target"
                    spinDuration={2}
                    hideDefaultCursor={hideDefaultCursor}
                />
            )}

            <Header />
            {showBreadcrumbs && (
                <div className="pt-16">
                    <div className="container mx-auto px-4 lg:px-8 py-4">
                        <Breadcrumbs />
                    </div>
                </div>
            )}
            <main className={showBreadcrumbs ? '' : 'pt-16'}>
                {children}
            </main>

            {/* Footer */}
            <footer className="py-8">
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mb-8" />
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center">
                        <p className="font-inter text-sm text-muted-foreground">
                            Made with ❤️ by secd3c
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}; 