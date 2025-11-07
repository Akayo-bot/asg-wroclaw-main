import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubbleProps {
  message: string;
  visible: boolean;
  position?: 'bottom-left' | 'bottom-center';
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ 
  message, 
  visible,
  position = 'bottom-left' 
}) => {
  const positionClasses = position === 'bottom-center' 
    ? 'left-1/2 -translate-x-1/2' 
    : 'left-0 ml-4';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`absolute -bottom-20 ${positionClasses} z-10`}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="relative px-4 py-2 bg-card/90 backdrop-blur-md border border-primary/40 rounded-lg shadow-lg shadow-primary/20">
            <p className="text-sm text-foreground font-inter whitespace-nowrap">
              {message}
            </p>
            {/* Tail */}
            <div className="absolute -top-2 left-6 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-transparent border-b-card/90" />
            <div className="absolute -top-[9px] left-[23px] w-0 h-0 border-l-[9px] border-r-[9px] border-b-[9px] border-transparent border-b-primary/40" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
