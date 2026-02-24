import * as React from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const handleToastClose = (event: React.SyntheticEvent) => {
          event.preventDefault();
          event.stopPropagation();
          dismiss(id);
        };

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            <ToastClose onPointerDown={handleToastClose} onClick={handleToastClose} />
            {action}
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>,
    document.body,
  );
}
