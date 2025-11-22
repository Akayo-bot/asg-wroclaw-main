import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
    hasChanges: boolean;
    onSave: () => Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export function SaveButton({
    hasChanges,
    onSave,
    loading: externalLoading,
    disabled: externalDisabled,
    className,
    children
}: SaveButtonProps) {
    const [state, setState] = useState<'idle' | 'saving' | 'success'>('idle');
    const loading = externalLoading || state === 'saving';

    const handleSave = async () => {
        if (!hasChanges || loading) return;

        setState('saving');
        try {
            await onSave();
            setState('success');
            setTimeout(() => setState('idle'), 1500);
        } catch {
            setState('idle');
        }
    };

    useEffect(() => {
        if (!hasChanges) {
            setState('idle');
        }
    }, [hasChanges]);

    const base = "w-full rounded-lg py-2.5 text-base font-medium transition-all duration-200 cursor-target";

    // Disabled state - no changes
    if (!hasChanges && state === 'idle') {
        return (
            <Button
                disabled
                className={cn(
                    base,
                    'bg-green-800/40 text-green-200 cursor-not-allowed opacity-60',
                    className
                )}
            >
                {children || 'Save Changes'}
            </Button>
        );
    }

    // Saving state
    if (loading) {
        return (
            <Button
                disabled
                className={cn(
                    base,
                    'bg-green-700 text-white flex justify-center items-center gap-2',
                    className
                )}
            >
                <Loader2 className="animate-spin w-5 h-5" />
                Saving…
            </Button>
        );
    }

    // Success state
    if (state === 'success') {
        return (
            <Button
                disabled
                className={cn(
                    base,
                    'bg-green-500 text-white flex justify-center items-center gap-2',
                    className
                )}
            >
                <Check className="w-5 h-5" />
                Saved!
            </Button>
        );
    }

    // Active state - has changes
    return (
        <Button
            onClick={handleSave}
            disabled={externalDisabled || !hasChanges}
            className={cn(
                base,
                'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/20',
                className
            )}
        >
            {children || 'Save Changes'}
        </Button>
    );
}



















