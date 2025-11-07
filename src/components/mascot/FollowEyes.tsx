import React, { useEffect, useState, useRef, RefObject } from 'react';
import { motion } from 'framer-motion';

interface FollowEyesProps {
  focusAnchor?: RefObject<HTMLElement> | null;
}

export const FollowEyes: React.FC<FollowEyesProps> = ({ focusAnchor }) => {
  const [leftEyePosition, setLeftEyePosition] = useState({ x: 0, y: 0 });
  const [rightEyePosition, setRightEyePosition] = useState({ x: 0, y: 0 });
  const [lastMouseMove, setLastMouseMove] = useState(Date.now());
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getElementCenter = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const calculateEyePosition = (eyeRef: React.RefObject<HTMLDivElement>, targetX: number, targetY: number) => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    
    const eyeRect = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eyeRect.left + eyeRect.width / 2;
    const eyeCenterY = eyeRect.top + eyeRect.height / 2;

    const angle = Math.atan2(targetY - eyeCenterY, targetX - eyeCenterX);
    const distance = Math.min(8, Math.hypot(targetX - eyeCenterX, targetY - eyeCenterY) / 50);

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  };

  useEffect(() => {
    if (prefersReducedMotion) return;

    let rafId: number;

    const updateEyePositions = () => {
      const timeSinceLastMove = Date.now() - lastMouseMove;
      
      // Priority 1: Recent cursor movement (within 500ms)
      if (timeSinceLastMove < 500) {
        return; // Eyes already following cursor
      }

      // Priority 2: Focus anchor (active input field)
      if (focusAnchor?.current) {
        const target = getElementCenter(focusAnchor.current);
        const leftPos = calculateEyePosition(leftEyeRef, target.x, target.y);
        const rightPos = calculateEyePosition(rightEyeRef, target.x, target.y);
        setLeftEyePosition(leftPos);
        setRightEyePosition(rightPos);
        return;
      }

      // Priority 3: Idle center
      setLeftEyePosition({ x: 0, y: 0 });
      setRightEyePosition({ x: 0, y: 0 });
    };

    const intervalId = setInterval(updateEyePositions, 100);

    const handleMouseMove = (e: MouseEvent) => {
      setLastMouseMove(Date.now());
      rafId = requestAnimationFrame(() => {
        const leftPos = calculateEyePosition(leftEyeRef, e.clientX, e.clientY);
        const rightPos = calculateEyePosition(rightEyeRef, e.clientX, e.clientY);
        setLeftEyePosition(leftPos);
        setRightEyePosition(rightPos);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(intervalId);
      cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion, focusAnchor, lastMouseMove]);

  return (
    <div className="flex gap-6">
      {/* Left Eye */}
      <div 
        ref={leftEyeRef}
        className="relative w-8 h-8 bg-foreground/90 rounded-full flex items-center justify-center"
      >
        <motion.div
          animate={prefersReducedMotion ? {} : leftEyePosition}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-3 h-3 bg-background rounded-full"
        />
      </div>

      {/* Right Eye */}
      <div 
        ref={rightEyeRef}
        className="relative w-8 h-8 bg-foreground/90 rounded-full flex items-center justify-center"
      >
        <motion.div
          animate={prefersReducedMotion ? {} : rightEyePosition}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-3 h-3 bg-background rounded-full"
        />
      </div>
    </div>
  );
};
