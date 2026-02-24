import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface GlassConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
}

export const GlassConfirmDialog: React.FC<GlassConfirmDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Підтвердити",
    cancelLabel = "Скасувати",
    onConfirm,
    variant = "default",
}) => {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent
                className={cn(
                    variant === "destructive" &&
                        "border-red-400/30 ring-red-400/20 shadow-[0_0_0_1px_rgba(239,68,68,.16),0_20px_55px_-24px_rgba(239,68,68,.45)]"
                )}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={cn(
                            variant === "destructive" &&
                                "border-red-400/40 bg-[rgba(239,68,68,.16)] text-red-100 ring-1 ring-red-400/25 hover:bg-[rgba(239,68,68,.26)] hover:text-white hover:shadow-[0_0_30px_-10px_rgba(239,68,68,.65)]"
                        )}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
