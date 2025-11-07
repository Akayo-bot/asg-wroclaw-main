import React, { useEffect, useState, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import confetti from 'canvas-confetti';
import { MascotState, mascotBehaviors } from './mascotStates';
import { FollowEyes } from './FollowEyes';
import { SpeechBubble } from './SpeechBubble';
import { fadeIn } from '@/lib/authAnimations';

interface MascotProps {
  state: MascotState;
  className?: string;
  showEyes?: boolean;
  focusAnchor?: RefObject<HTMLElement> | null;
}

export const Mascot: React.FC<MascotProps> = ({ 
  state, 
  className = '',
  showEyes = true,
  focusAnchor = null
}) => {
  const [animationData, setAnimationData] = useState<any>(null);
  const [prevState, setPrevState] = useState<MascotState>(state);
  const behavior = mascotBehaviors[state];

  // Load Lottie animation
  useEffect(() => {
    fetch(behavior.animation)
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load mascot animation:', err));
  }, [behavior.animation]);

  // Trigger confetti on success
  useEffect(() => {
    if (state === 'success' && prevState !== 'success' && behavior.confetti) {
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#4CAF50', '#81C784', '#66BB6A']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#4CAF50', '#81C784', '#66BB6A']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
    setPrevState(state);
  }, [state, prevState, behavior.confetti]);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Mascot Animation */}
      <motion.div
        key={state}
        initial={prefersReducedMotion ? {} : { scale: 0.9, opacity: 0 }}
        animate={prefersReducedMotion ? {} : { 
          scale: state === 'error' && behavior.shake ? [1, 1.05, 0.95, 1.05, 1] : 1, 
          opacity: 1 
        }}
        exit={prefersReducedMotion ? {} : { scale: 0.9, opacity: 0 }}
        transition={{ 
          duration: state === 'error' ? 0.5 : 0.3,
          times: state === 'error' ? [0, 0.25, 0.5, 0.75, 1] : undefined
        }}
        className={`relative w-64 h-64 md:w-80 md:h-80 ${state === 'idle' ? 'animate-breathe' : ''}`}
      >
        {animationData && (
          <Lottie
            animationData={animationData}
            loop={state !== 'success' && state !== 'error'}
            className="w-full h-full"
          />
        )}
        
        {/* Follow Eyes Overlay - Always visible */}
        {showEyes && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <FollowEyes focusAnchor={focusAnchor} />
          </motion.div>
        )}
      </motion.div>

      {/* Speech Bubble */}
      <SpeechBubble 
        message={behavior.message}
        visible={true}
        position={behavior.speechPosition || 'bottom-left'}
      />

      {/* Glow Effect */}
      <div 
        className={`absolute inset-0 blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${
          state === 'success' ? 'bg-primary' :
          state === 'error' ? 'bg-destructive' :
          'bg-primary/30'
        }`}
      />
    </div>
  );
};
