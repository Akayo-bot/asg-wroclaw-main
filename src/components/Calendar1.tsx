"use client";

import { motion, useAnimation, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import React from "react";

interface Calendar1Props extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
  onAnimate?: () => void;
  triggerAnimation?: number;
  isHoveringExternal?: boolean;
  isFocused?: boolean;
  isPopoverOpen?: boolean;
}

const frameVariants: Variants = {
  normal: {
    opacity: 1,
    scale: 1,
    rotate: 0,
  },
  animate: {
    opacity: [1, 0.6, 1],
    scale: [1, 1.15, 1],
    transition: {
      duration: 1.2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse" as const,
    },
  },
  click: {
    opacity: [1, 0.4, 1],
    scale: [1, 1.3, 1],
    rotate: [0, -10, 10, 0],
    transition: {
      duration: 0.8,
      ease: "easeOut",
      times: [0, 0.5, 1],
    },
  },
  inputChange: {
    opacity: [1, 0.5, 1],
    scale: [1, 1.2, 1],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 0.7,
      ease: "easeOut",
      times: [0, 0.5, 1],
    },
  },
};

const numberVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.2,
    y: -15,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 18,
      duration: 0.6,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.2,
    y: 15,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

const Calendar1 = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  onAnimate,
  triggerAnimation,
  isHoveringExternal = false,
  isFocused = false,
  isPopoverOpen = false,
  ...props
}: Calendar1Props) => {
  const controls = useAnimation();
  const [currentNumber, setCurrentNumber] = React.useState(1);
  const [isHovering, setIsHovering] = React.useState(false);
  const [isClicked, setIsClicked] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const resetTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isResettingRef = React.useRef(false);
  
  // Зацикливаем анимацию если input в focus или popover открыт
  const shouldLoopAnimation = isFocused || isPopoverOpen;
  const effectiveHovering = isHovering || isHoveringExternal || shouldLoopAnimation;

  // Анимация при изменении input
  React.useEffect(() => {
    if (triggerAnimation !== undefined && triggerAnimation > 0) {
      controls.start("inputChange").then(() => {
        // После завершения анимации input, возвращаемся к нормальному состоянию или hover
        setTimeout(() => {
          if (effectiveHovering || shouldLoopAnimation) {
            controls.start("animate");
          } else {
            controls.start("normal");
          }
        }, 100);
      });
      onAnimate?.();
    }
  }, [triggerAnimation, controls, onAnimate, effectiveHovering, shouldLoopAnimation]);
  
  // Зацикливаем анимацию если input в focus или popover открыт
  React.useEffect(() => {
    if (shouldLoopAnimation) {
      controls.start("animate");
    } else if (!isHovering && !isHoveringExternal) {
      controls.start("normal");
    }
  }, [shouldLoopAnimation, isHovering, isHoveringExternal, controls]);

  // Анимация чисел при hover или когда input в focus/popover открыт
  React.useEffect(() => {
    // Очищаем предыдущие интервалы
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    if (!effectiveHovering && !shouldLoopAnimation) {
      setCurrentNumber(1);
      isResettingRef.current = false;
      return;
    }

    const startInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        setCurrentNumber((prev) => {
          if (prev >= 10 && !isResettingRef.current) {
            // Когда достигаем 10, очищаем интервал и ждем секунду
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            isResettingRef.current = true;
            resetTimeoutRef.current = setTimeout(() => {
              setCurrentNumber(1);
              isResettingRef.current = false;
              // Запускаем интервал снова после сброса
              startInterval();
            }, 1000);
            return 10;
          }
          if (isResettingRef.current) {
            return prev;
          }
          return prev + 1;
        });
      }, 800); // Увеличено до 800 мс для более медленной анимации
    };

    startInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      isResettingRef.current = false;
    };
  }, [effectiveHovering, shouldLoopAnimation]);

  const handleClick = () => {
    setIsClicked(true);
    controls.start("click").then(() => {
      setIsClicked(false);
      setTimeout(() => {
        if (effectiveHovering || shouldLoopAnimation) {
          controls.start("animate");
        } else {
          controls.start("normal");
        }
      }, 100);
    });
    onAnimate?.();
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{
        cursor: "pointer",
        userSelect: "none",
        pointerEvents: "auto",
      }}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setIsHovering(true);
        if (!isClicked && !shouldLoopAnimation) {
          // Используем setTimeout для предотвращения конфликта с другими анимациями
          setTimeout(() => {
            controls.start("animate");
          }, 50);
        }
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        setIsHovering(false);
        if (!isClicked && !shouldLoopAnimation) {
          controls.start("normal");
        }
      }}
      onClick={(e) => {
        // Не останавливаем всплытие - позволяем клику достичь PopoverTrigger
        handleClick();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'auto' }}
        {...props}
      >
        <motion.rect
          x="3"
          y="4"
          width="18"
          height="18"
          rx="2"
          variants={frameVariants}
          animate={controls}
          initial="normal"
        />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
        <AnimatePresence mode="wait">
          <motion.text
            x="11"
            y="18"
            fontSize="8"
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            key={currentNumber}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={numberVariants}
          >
            {currentNumber}
          </motion.text>
        </AnimatePresence>
      </svg>
    </div>
  );
};

export { Calendar1 };
