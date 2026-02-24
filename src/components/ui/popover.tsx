import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { disablePortal?: boolean }
>(({ className, align = "center", sideOffset = 4, disablePortal = false, ...props }, ref) => {
  const Portal = disablePortal ? React.Fragment : PopoverPrimitive.Portal;

  return (
    <Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[10000] w-72 rounded-2xl border border-emerald-400/20 bg-[rgba(20,24,22,0.88)] p-4 text-emerald-50 ring-1 ring-emerald-400/10 shadow-[0_12px_36px_-12px_rgba(16,185,129,.4)] backdrop-blur-2xl outline-none",
          className,
        )}
        asChild
        {...props}
      >
        <motion.div
          initial={{ y: 70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {props.children}
        </motion.div>
      </PopoverPrimitive.Content>
    </Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

const PopoverAnchor = PopoverPrimitive.Anchor;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
