// Reusable Framer Motion animation variants for auth components

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const shakeError = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.4 }
};

export const scaleSuccess = {
  scale: [1, 1.05, 1],
  transition: { duration: 0.3 }
};

export const blobFloat = (delay: number = 0) => ({
  y: [0, -20, 0],
  x: [0, 10, 0],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: [0.4, 0, 0.6, 1] as const,
    delay
  }
});

export const tabSlide = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
  transition: { duration: 0.2 }
};

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.2 }
};

export const slideInRight = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const buttonHover = {
  scale: 1.02,
  y: -2,
  transition: { duration: 0.2 }
};

export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 }
};
