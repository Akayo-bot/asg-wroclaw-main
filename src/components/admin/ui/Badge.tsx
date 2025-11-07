import React from 'react';
import { cn } from '@/lib/utils';

export function Badge({ className, children }: React.PropsWithChildren<{ className?: string }>) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1",
                className
            )}
        >
            {children}
        </span>
    );
}

