import React, { useEffect, useRef, useState } from "react";

export const MarqueeText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const checkOverflow = () => {
      // Measure strictly the content width against the container width
      // Subtract a small buffer (e.g. 1px) to avoid sub-pixel jitter issues
      const hasOverflow = content.scrollWidth > container.clientWidth;
      setIsOverflowing(hasOverflow);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(container);
    resizeObserver.observe(content);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children]);

  return (
    <div ref={containerRef} className={`w-full overflow-hidden relative ${className}`}>
      <div
        className={`flex items-center w-max ${
          isOverflowing ? "group-hover:animate-marquee-scroll" : ""
        }`}
      >
        <div className="flex items-center shrink-0">
          <div ref={contentRef} className="flex items-center">
            {children}
          </div>
          {/* Spacer is only added if overflowing, but NOT part of the measured contentRef */}
          {isOverflowing && <div className="w-8 shrink-0" />}
        </div>
        
        {isOverflowing && (
          <div className="flex items-center shrink-0" aria-hidden="true">
            <div className="flex items-center">
              {children}
            </div>
            <div className="w-8 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
};
